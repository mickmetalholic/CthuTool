import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ConfigError,
  defaultObservabilityConfig,
  loadBrowserSitesFile,
  mergeBrowserSites,
  parseBrowserSitesConfig,
  parseObservabilityConfig,
  parseObservabilityEnv,
} from './index';

describe('browser sites config', () => {
  it('accepts required-auth site config', () => {
    const sites = parseBrowserSitesConfig({
      version: 1,
      sites: [
        {
          allowedOrigins: ['https://movie.douban.com'],
          authPolicy: 'required',
          displayName: 'Douban',
          loginUrl: 'https://accounts.douban.com/passport/login',
          profileName: 'douban-main',
          siteId: 'douban',
          verifyUrl: 'https://www.douban.com/mine/',
        },
      ],
    });

    expect(sites).toEqual([
      {
        allowedOrigins: ['https://movie.douban.com'],
        authPolicy: 'required',
        displayName: 'Douban',
        loginUrl: 'https://accounts.douban.com/passport/login',
        profileName: 'douban-main',
        siteId: 'douban',
        verifyUrl: 'https://www.douban.com/mine/',
      },
    ]);
  });

  it('accepts anonymous site config without profile urls', () => {
    const sites = parseBrowserSitesConfig({
      version: 1,
      sites: [
        {
          allowedOrigins: ['https://example.com'],
          authPolicy: 'anonymous',
          displayName: 'Example',
          siteId: 'example',
        },
      ],
    });

    expect(sites[0]).toEqual({
      allowedOrigins: ['https://example.com'],
      authPolicy: 'anonymous',
      displayName: 'Example',
      siteId: 'example',
    });
  });

  it('rejects invalid fields with structured details', () => {
    expect(() =>
      parseBrowserSitesConfig({
        version: 1,
        sites: [
          {
            allowedOrigins: ['not-a-url'],
            authPolicy: 'required',
            displayName: 'Bad',
            loginUrl: 'https://example.com/login',
            profileName: 'bad-main',
            siteId: '../bad',
            verifyUrl: 'https://example.com/me',
          },
        ],
      }),
    ).toThrow(ConfigError);
  });

  it('rejects duplicate site ids', () => {
    expect(() =>
      parseBrowserSitesConfig({
        version: 1,
        sites: [
          {
            allowedOrigins: ['https://a.example'],
            authPolicy: 'anonymous',
            displayName: 'A',
            siteId: 'dup',
          },
          {
            allowedOrigins: ['https://b.example'],
            authPolicy: 'anonymous',
            displayName: 'B',
            siteId: 'dup',
          },
        ],
      }),
    ).toThrow(/sites.1.siteId/);
  });

  it('loads readable files and reports malformed json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cthutool-config-'));
    try {
      const validPath = join(dir, 'browser-sites.json');
      await writeFile(
        validPath,
        JSON.stringify({
          version: 1,
          sites: [
            {
              allowedOrigins: ['https://example.com'],
              authPolicy: 'anonymous',
              displayName: 'Example',
              siteId: 'example',
            },
          ],
        }),
        'utf8',
      );
      await expect(loadBrowserSitesFile(validPath)).resolves.toHaveLength(1);

      const invalidPath = join(dir, 'broken.json');
      await writeFile(invalidPath, '{', 'utf8');
      await expect(loadBrowserSitesFile(invalidPath)).rejects.toThrow(/PARSE/);
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  it('reports unreadable files with the path', async () => {
    const path = join(tmpdir(), 'missing-browser-sites.json');

    await expect(loadBrowserSitesFile(path)).rejects.toThrow(path);
  });

  it('merges overrides by site id using array replacement', () => {
    const effective = mergeBrowserSites(
      [
        {
          allowedOrigins: ['https://old.example'],
          authPolicy: 'required',
          defaultBlockResources: ['image'],
          displayName: 'Old',
          loginUrl: 'https://old.example/login',
          profileName: 'old-main',
          siteId: 'old',
          verifyUrl: 'https://old.example/me',
        },
      ],
      [
        {
          allowedOrigins: ['https://new.example'],
          authPolicy: 'required',
          displayName: 'New',
          siteId: 'old',
        },
        {
          allowedOrigins: ['https://z.example'],
          authPolicy: 'anonymous',
          displayName: 'Zed',
          siteId: 'zed',
        },
      ],
    );

    expect(effective).toEqual([
      {
        allowedOrigins: ['https://new.example'],
        authPolicy: 'required',
        defaultBlockResources: ['image'],
        displayName: 'New',
        loginUrl: 'https://old.example/login',
        profileName: 'old-main',
        siteId: 'old',
        verifyUrl: 'https://old.example/me',
      },
      {
        allowedOrigins: ['https://z.example'],
        authPolicy: 'anonymous',
        displayName: 'Zed',
        siteId: 'zed',
      },
    ]);
  });

  it('does not expose raw auth state fields', () => {
    const sites = parseBrowserSitesConfig({
      version: 1,
      sites: [
        {
          allowedOrigins: ['https://example.com'],
          authPolicy: 'anonymous',
          cookies: [{ name: 'sid', value: 'secret' }],
          displayName: 'Example',
          localStorage: { token: 'secret' },
          profileDir: '/tmp/profile',
          siteId: 'example',
          storageState: { cookies: [] },
        },
      ],
    });

    expect(JSON.stringify(sites)).not.toContain('secret');
    expect(sites[0]).not.toHaveProperty('profileDir');
  });
});

describe('observability config', () => {
  it('returns safe environment-specific defaults', () => {
    expect(defaultObservabilityConfig('development')).toEqual({
      consoleDiagnostics: true,
      diagnosticsDir: './data/diagnostics',
      diagnosticsEnabled: true,
      logLevel: 'debug',
      samplingRatio: 1,
    });

    expect(defaultObservabilityConfig('production')).toEqual({
      consoleDiagnostics: false,
      diagnosticsDir: './data/diagnostics',
      diagnosticsEnabled: false,
      logLevel: 'info',
      samplingRatio: 1,
    });

    expect(defaultObservabilityConfig('test')).toEqual({
      consoleDiagnostics: false,
      diagnosticsDir: './tmp/diagnostics',
      diagnosticsEnabled: false,
      logLevel: 'error',
      samplingRatio: 1,
    });
  });

  it('accepts valid observability overrides', () => {
    expect(
      parseObservabilityConfig(
        {
          consoleDiagnostics: false,
          diagnosticsDir: './tmp/obs',
          diagnosticsEnabled: true,
          logLevel: 'warn',
          samplingRatio: 0.25,
          telemetryExporterEndpoint: 'https://otel.example/v1/traces',
        },
        { environment: 'production' },
      ),
    ).toEqual({
      consoleDiagnostics: false,
      diagnosticsDir: './tmp/obs',
      diagnosticsEnabled: true,
      logLevel: 'warn',
      samplingRatio: 0.25,
      telemetryExporterEndpoint: 'https://otel.example/v1/traces',
    });
  });

  it('parses observability environment variables consistently', () => {
    expect(
      parseObservabilityEnv({
        NODE_ENV: 'production',
        OBSERVABILITY_CONSOLE_DIAGNOSTICS: 'true',
        OBSERVABILITY_DIAGNOSTICS_DIR: './var/diagnostics',
        OBSERVABILITY_DIAGNOSTICS_ENABLED: 'true',
        OBSERVABILITY_EXPORTER_ENDPOINT: 'https://otel.example/v1/metrics',
        OBSERVABILITY_LOG_LEVEL: 'debug',
        OBSERVABILITY_SAMPLING_RATIO: '0.5',
      }),
    ).toEqual({
      consoleDiagnostics: true,
      diagnosticsDir: './var/diagnostics',
      diagnosticsEnabled: true,
      logLevel: 'debug',
      samplingRatio: 0.5,
      telemetryExporterEndpoint: 'https://otel.example/v1/metrics',
    });
  });

  it('rejects invalid observability values with structured issues', () => {
    expect(() =>
      parseObservabilityConfig({
        consoleDiagnostics: 'yes',
        diagnosticsDir: '',
        diagnosticsEnabled: 'no',
        logLevel: 'verbose',
        samplingRatio: 2,
        telemetryExporterEndpoint: 'not-a-url',
      }),
    ).toThrow(ConfigError);

    try {
      parseObservabilityConfig({
        logLevel: 'verbose',
        samplingRatio: 2,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect((error as ConfigError).issues).toEqual([
        {
          message: 'must be debug, info, warn, or error',
          path: 'observability.logLevel',
        },
        {
          message: 'must be a number between 0 and 1',
          path: 'observability.samplingRatio',
        },
      ]);
    }
  });

  it('rejects sensitive observability fields without exposing values', () => {
    expect(() =>
      parseObservabilityConfig({
        cookies: [{ name: 'sid', value: 'secret-cookie' }],
        localStorage: { token: 'secret-token' },
        logLevel: 'info',
        profileDir: '/tmp/profile',
        storageState: { cookies: [] },
      }),
    ).toThrow(ConfigError);

    try {
      parseObservabilityConfig({
        nested: {
          apiToken: 'secret-token',
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect((error as ConfigError).message).toContain(
        'observability.nested.apiToken',
      );
      expect((error as ConfigError).message).not.toContain('secret-token');
    }
  });

  it('keeps observability config separate from browser sites config', () => {
    const siteInput = {
      version: 1,
      sites: [
        {
          allowedOrigins: ['https://example.com'],
          authPolicy: 'anonymous',
          displayName: 'Example',
          siteId: 'example',
        },
      ],
    };

    expect(parseBrowserSitesConfig(siteInput)).toEqual([
      {
        allowedOrigins: ['https://example.com'],
        authPolicy: 'anonymous',
        displayName: 'Example',
        siteId: 'example',
      },
    ]);

    expect(parseObservabilityConfig({}, { environment: 'production' })).toEqual(
      {
        consoleDiagnostics: false,
        diagnosticsDir: './data/diagnostics',
        diagnosticsEnabled: false,
        logLevel: 'info',
        samplingRatio: 1,
      },
    );
  });
});
