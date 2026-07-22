import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(__dirname, "..", "..");
const installerPath = join(root, "scripts", "install-chc.ps1");
const pwshAvailable =
  spawnSync("pwsh", ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"], {
    encoding: "utf8",
  }).status === 0;

function quotePowerShell(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function createFixture() {
  const dir = mkdtempSync(join(tmpdir(), "cthutool-install-pwsh-test-"));
  const logPath = join(dir, "commands.log");

  return {
    dir,
    logPath,
    readLog: () => {
      try {
        return readFileSync(logPath, "utf8");
      } catch {
        return "";
      }
    },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function commandMocks(logPath: string, nodeVersion = "24.14.1"): string {
  return `
function git { $global:LASTEXITCODE = 0 }
function node { Write-Output ${quotePowerShell(nodeVersion)}; $global:LASTEXITCODE = 0 }
function npm {
  Add-Content -LiteralPath ${quotePowerShell(logPath)} -Value ("npm" + [char]9 + ($args -join [char]9))
  $global:LASTEXITCODE = 0
}
function chc {
  Add-Content -LiteralPath ${quotePowerShell(logPath)} -Value ("chc" + [char]9 + ($args -join [char]9))
  $global:LASTEXITCODE = 0
}
`;
}

function runPowerShell(script: string, env: Record<string, string> = {}) {
  return spawnSync(
    "pwsh",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        ...env,
      },
    },
  );
}

const describePowerShell = pwshAvailable ? describe : describe.skip;

describePowerShell("install-chc.ps1", () => {
  it("uses the script repository root for local file execution", () => {
    const fixture = createFixture();
    try {
      const result = runPowerShell(
        `${commandMocks(fixture.logPath)}
& ${quotePowerShell(installerPath)}
`,
        {
          CHC_INSTALL_MODE: "auto",
          CHC_INSTALL_COMPLETION: "auto",
        },
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("mode: local");
      const log = fixture.readLog();
      expect(log).toContain(
        `npm\tinstall\t-g\t--ignore-scripts\t${root}`,
      );
      expect(log).toContain("chc\tcompletion\tenable\tpowershell");
    } finally {
      fixture.cleanup();
    }
  });

  it("uses remote managed mode for raw expression execution", () => {
    const fixture = createFixture();
    const installDir = join(fixture.dir, "managed", "CthuTool");
    const target = "2222222222222222222222222222222222222222";
    try {
      const gitMock = `
function git {
  Add-Content -LiteralPath ${quotePowerShell(fixture.logPath)} -Value ("git" + [char]9 + ($args -join [char]9))

  if ($args[0] -eq "-C" -and $args[2] -eq "rev-parse" -and $args[3] -eq "--git-dir") {
    $global:LASTEXITCODE = 1
    return
  }

  if ($args[0] -eq "clone") {
    New-Item -ItemType Directory -Path (Join-Path $args[2] ".git") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $args[2] "apps/cli/dist") -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $args[2] "package.json") -Value '{"name":"cthutool"}'
    Set-Content -LiteralPath (Join-Path $args[2] "apps/cli/dist/index.js") -Value 'console.log("mock");'
    $global:LASTEXITCODE = 0
    return
  }

  if ($args[0] -eq "-C" -and $args[2] -eq "rev-parse" -and $args[3] -eq "--verify") {
    Write-Output ${quotePowerShell(target)}
  }

  $global:LASTEXITCODE = 0
}
`;
      const result = runPowerShell(
        `${commandMocks(fixture.logPath)}
${gitMock}
Invoke-Expression (Get-Content -LiteralPath ${quotePowerShell(installerPath)} -Raw)
`,
        {
          CHC_INSTALL_DIR: installDir,
          CHC_INSTALL_MODE: "auto",
          CHC_INSTALL_COMPLETION: "none",
        },
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("mode: remote");
      const log = fixture.readLog();
      expect(log).toContain(
        `git\tclone\thttps://github.com/mickmetalholic/CthuTool.git\t${installDir}`,
      );
      expect(log).toContain(
        `npm\tinstall\t-g\t--ignore-scripts\t${installDir}`,
      );
      expect(log).not.toContain("chc\tcompletion\tenable");
    } finally {
      fixture.cleanup();
    }
  });

  it("blocks a dirty managed checkout before mutation", () => {
    const fixture = createFixture();
    const installDir = join(fixture.dir, "managed", "CthuTool");
    mkdirSync(join(installDir, ".git"), { recursive: true });
    mkdirSync(join(installDir, "apps", "cli", "dist"), { recursive: true });
    writeFileSync(join(installDir, "package.json"), '{"name":"cthutool"}\n');
    writeFileSync(
      join(installDir, "apps", "cli", "dist", "index.js"),
      'console.log("mock");\n',
    );

    try {
      const gitMock = `
function git {
  Add-Content -LiteralPath ${quotePowerShell(fixture.logPath)} -Value ("git" + [char]9 + ($args -join [char]9))

  if ($args[0] -eq "-C" -and $args[2] -eq "status") {
    Write-Output "?? local-change"
  }

  $global:LASTEXITCODE = 0
}
`;
      const result = runPowerShell(
        `${commandMocks(fixture.logPath)}
${gitMock}
& ${quotePowerShell(installerPath)}
`,
        {
          CHC_INSTALL_DIR: installDir,
          CHC_INSTALL_MODE: "remote",
          CHC_INSTALL_COMPLETION: "none",
        },
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Update blocked");
      const log = fixture.readLog();
      expect(log).not.toContain("\tremote\tset-url\t");
      expect(log).not.toContain("\tcheckout\t");
      expect(log).not.toContain("npm\tinstall");
      expect(log).not.toMatch(/\t(reset|rebase|stash|clean)\t/);
    } finally {
      fixture.cleanup();
    }
  });

  it("fails before global install when the local bundle is missing", () => {
    const fixture = createFixture();
    const fakeRepo = join(fixture.dir, "fake-repo");
    mkdirSync(join(fakeRepo, "scripts"), { recursive: true });
    writeFileSync(join(fakeRepo, "package.json"), '{"name":"cthutool"}\n');
    writeFileSync(
      join(fakeRepo, "scripts", "install-chc.ps1"),
      readFileSync(installerPath, "utf8"),
    );

    try {
      const result = runPowerShell(
        `${commandMocks(fixture.logPath)}
& ${quotePowerShell(join(fakeRepo, "scripts", "install-chc.ps1"))}
`,
        {
          CHC_INSTALL_MODE: "local",
          CHC_INSTALL_COMPLETION: "none",
        },
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Missing committed CLI bundle");
      expect(fixture.readLog()).not.toContain("npm\tinstall");
    } finally {
      fixture.cleanup();
    }
  });

  it("enforces Node 24 before global install", () => {
    const fixture = createFixture();
    try {
      const result = runPowerShell(
        `${commandMocks(fixture.logPath, "23.11.0")}
& ${quotePowerShell(installerPath)}
`,
        {
          CHC_INSTALL_MODE: "local",
          CHC_INSTALL_COMPLETION: "none",
        },
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Node 24 is required");
      expect(fixture.readLog()).not.toContain("npm\tinstall");
    } finally {
      fixture.cleanup();
    }
  });
});
