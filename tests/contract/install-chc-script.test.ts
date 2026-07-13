import {
  cpSync,
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
const installerPath = join(root, "scripts", "install-chc.sh");

type RunOptions = {
  readonly args?: readonly string[];
  readonly env?: Record<string, string>;
  readonly input?: string;
};

function writeExecutable(path: string, content: string): void {
  writeFileSync(path, content, { mode: 0o755 });
}

function createFixture() {
  const dir = mkdtempSync(join(tmpdir(), "cthutool-install-test-"));
  const binDir = join(dir, "bin");
  const logPath = join(dir, "commands.log");
  mkdirSync(binDir);

  writeExecutable(
    join(binDir, "node"),
    `#!/usr/bin/env bash
exit 0
`,
  );

  writeExecutable(
    join(binDir, "npm"),
    `#!/usr/bin/env bash
printf 'npm' >> "${logPath}"
for arg in "$@"; do
  printf '\\t%s' "$arg" >> "${logPath}"
done
printf '\\n' >> "${logPath}"
`,
  );

  writeExecutable(
    join(binDir, "chc"),
    `#!/usr/bin/env bash
printf 'chc' >> "${logPath}"
for arg in "$@"; do
  printf '\\t%s' "$arg" >> "${logPath}"
done
printf '\\n' >> "${logPath}"
exit 0
`,
  );

  writeExecutable(
    join(binDir, "git"),
    `#!/usr/bin/env bash
printf 'git' >> "${logPath}"
for arg in "$@"; do
  printf '\\t%s' "$arg" >> "${logPath}"
done
printf '\\n' >> "${logPath}"

if [ "$1" = "clone" ]; then
  mkdir -p "$3/apps/cli/dist"
  printf '{"name":"cthutool","bin":{"chc":"apps/cli/bin/chc.mjs"}}\\n' > "$3/package.json"
  if [ "\${MOCK_GIT_CREATE_BUNDLE:-1}" = "1" ]; then
    printf 'console.log("mock bundle");\\n' > "$3/apps/cli/dist/index.js"
  fi
  exit 0
fi

if [ "$1" = "-C" ] && [ "$3" = "rev-parse" ]; then
  exit 1
fi

exit 0
`,
  );

  const env = {
    ...process.env,
    PATH: `${binDir}:${process.env.PATH ?? ""}`,
    CHC_INSTALL_DIR: join(dir, "managed", "CthuTool"),
    SHELL: "/bin/zsh",
  } as Record<string, string>;

  return {
    dir,
    env,
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

function runInstaller(options: RunOptions = {}) {
  return spawnSync("bash", [...(options.args ?? [installerPath])], {
    cwd: root,
    encoding: "utf8",
    input: options.input,
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

describe("install-chc.sh", () => {
  it("uses remote managed mode for raw stdin execution", () => {
    const fixture = createFixture();
    try {
      const script = readFileSync(installerPath, "utf8");
      const result = runInstaller({
        args: ["-s"],
        input: script,
        env: fixture.env,
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("mode: remote");
      const log = fixture.readLog();
      expect(log).toContain(
        `git\tclone\thttps://github.com/mickmetalholic/CthuTool.git\t${fixture.env.CHC_INSTALL_DIR}`,
      );
      expect(log).toContain(
        `npm\tinstall\t-g\t--ignore-scripts\t${fixture.env.CHC_INSTALL_DIR}`,
      );
      expect(log).toContain("chc\tcompletion\tenable\tzsh");
    } finally {
      fixture.cleanup();
    }
  });

  it("uses the script repository root for local file execution", () => {
    const fixture = createFixture();
    try {
      const result = runInstaller({ env: fixture.env });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("mode: local");
      const log = fixture.readLog();
      expect(log).not.toContain("git\tclone");
      expect(log).not.toContain("git\t-C");
      expect(log).toContain(`npm\tinstall\t-g\t--ignore-scripts\t${root}`);
      expect(log).toContain("chc\tcompletion\tenable\tzsh");
    } finally {
      fixture.cleanup();
    }
  });

  it("honors explicit local and remote mode overrides", () => {
    const localFixture = createFixture();
    try {
      const localResult = runInstaller({
        env: {
          ...localFixture.env,
          CHC_INSTALL_MODE: "local",
        },
      });

      expect(localResult.status).toBe(0);
      expect(localResult.stdout).toContain("mode: local");
      expect(localFixture.readLog()).toContain(
        `npm\tinstall\t-g\t--ignore-scripts\t${root}`,
      );
      expect(localFixture.readLog()).not.toContain("git\tclone");
    } finally {
      localFixture.cleanup();
    }

    const remoteFixture = createFixture();
    try {
      const remoteResult = runInstaller({
        env: {
          ...remoteFixture.env,
          CHC_INSTALL_MODE: "remote",
        },
      });

      expect(remoteResult.status).toBe(0);
      expect(remoteResult.stdout).toContain("mode: remote");
      expect(remoteFixture.readLog()).toContain(
        `git\tclone\thttps://github.com/mickmetalholic/CthuTool.git\t${remoteFixture.env.CHC_INSTALL_DIR}`,
      );
      expect(remoteFixture.readLog()).toContain(
        `npm\tinstall\t-g\t--ignore-scripts\t${remoteFixture.env.CHC_INSTALL_DIR}`,
      );
    } finally {
      remoteFixture.cleanup();
    }
  });

  it("fails before global install when a local checkout bundle is missing", () => {
    const fixture = createFixture();
    const fakeRepo = join(fixture.dir, "fake-repo");
    mkdirSync(join(fakeRepo, "scripts"), { recursive: true });
    writeFileSync(join(fakeRepo, "package.json"), '{"name":"cthutool"}\n');
    cpSync(installerPath, join(fakeRepo, "scripts", "install-chc.sh"));

    try {
      const result = runInstaller({
        args: [join(fakeRepo, "scripts", "install-chc.sh")],
        env: {
          ...fixture.env,
          CHC_INSTALL_MODE: "local",
        },
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Missing committed CLI bundle");
      expect(fixture.readLog()).not.toContain("npm\tinstall");
    } finally {
      fixture.cleanup();
    }
  });

  it("fails before global install when a remote checkout bundle is missing", () => {
    const fixture = createFixture();
    try {
      const result = runInstaller({
        env: {
          ...fixture.env,
          CHC_INSTALL_MODE: "remote",
          MOCK_GIT_CREATE_BUNDLE: "0",
        },
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Missing committed CLI bundle");
      expect(fixture.readLog()).toContain("git\tclone");
      expect(fixture.readLog()).not.toContain("npm\tinstall");
    } finally {
      fixture.cleanup();
    }
  });

  it("allows automatic zsh completion setup to be disabled", () => {
    const fixture = createFixture();
    try {
      const result = runInstaller({
        env: {
          ...fixture.env,
          CHC_INSTALL_COMPLETION: "none",
        },
      });

      expect(result.status).toBe(0);
      expect(fixture.readLog()).not.toContain("chc\tcompletion\tenable\tzsh");
    } finally {
      fixture.cleanup();
    }
  });

  it("skips automatic completion when the login shell is not zsh", () => {
    const fixture = createFixture();
    try {
      const result = runInstaller({
        env: {
          ...fixture.env,
          SHELL: "",
        },
      });

      expect(result.status).toBe(0);
      expect(fixture.readLog()).not.toContain("chc\tcompletion\tenable\tzsh");
    } finally {
      fixture.cleanup();
    }
  });
});
