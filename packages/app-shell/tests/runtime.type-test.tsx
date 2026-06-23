import {
  AppRuntimeProvider,
  BrowserProfileActions,
  CapabilityGate,
  createConsoleObservableLogger,
  createDesktopRuntime,
  isSafeDiagnosticsHref,
  LocalStatusPage,
  MetricSummary,
  mainNavigation,
  type ObservableRuntimeState,
  ObservableStatusSummary,
  OverviewPage,
  PageFrame,
  PageHeader,
  PageMetadataList,
  PageNotice,
  PageStatusList,
  PageSurface,
  PageToolbar,
  redactObservableDetails,
  settingsNavigation,
  webRuntime,
} from '../src';

const observableState: ObservableRuntimeState = {
  agent: {
    agentId: 'agent-local',
    lastSeenAt: '2026-06-23T00:00:00.000Z',
    status: 'ok',
  },
  backend: {
    checkedAt: '2026-06-23T00:00:00.000Z',
    label: 'Local backend',
    requestId: 'req-1',
    status: 'degraded',
    url: 'http://localhost:3000',
  },
  browserRuntime: {
    diagnostic: 'Host Chrome ready',
    status: 'ok',
  },
  diagnostics: {
    enabled: true,
    references: [
      {
        href: '/diagnostics/browser/diag-1',
        id: 'diag-1',
        summary: 'Blocked capture summary',
      },
    ],
    status: 'ok',
  },
};

const testLogger = createConsoleObservableLogger({
  consoleRef: {
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    log: () => undefined,
    warn: () => undefined,
  },
  environment: 'test',
});

const desktopRuntime = createDesktopRuntime(
  {
    windowAction: () => undefined,
  },
  {
    logger: testLogger,
    state: observableState,
  },
);

export const RuntimeTypeTest = () => (
  <AppRuntimeProvider runtime={desktopRuntime}>
    <PageHeader eyebrow={desktopRuntime.kind} title={mainNavigation[0].label} />
    <PageFrame
      atmosphere={<span aria-hidden="true" />}
      description="Shared shell page frame"
      eyebrow={desktopRuntime.kind}
      title="Overview"
      toolbar={<PageToolbar start={<button type="button">Refresh</button>} />}
    >
      <PageNotice title="Backend unavailable" variant="warning">
        Check the configured backend URL.
      </PageNotice>
      <MetricSummary metrics={[{ label: 'Runtime', value: 'desktop' }]} />
      <ObservableStatusSummary />
      <ObservableStatusSummary state={observableState} />
      <PageMetadataList rows={[['Backend URL', 'http://localhost:3000']]} />
      <PageStatusList
        rows={[
          { label: 'Connection', status: 'connected', value: 'Connected' },
        ]}
      />
    </PageFrame>
    <CapabilityGate capability="canControlWindow">
      <button type="button">{settingsNavigation[0].label}</button>
    </CapabilityGate>
    <AppRuntimeProvider runtime={webRuntime}>
      <CapabilityGate
        capability="canUseLocalBrowserProfiles"
        fallback={<PageNotice>Desktop only</PageNotice>}
      >
        <BrowserProfileActions
          onClear={() => undefined}
          onOpen={() => undefined}
          onVerify={() => undefined}
        />
      </CapabilityGate>
      <ObservableStatusSummary />
    </AppRuntimeProvider>
    <OverviewPage
      metrics={[{ label: 'Runtime', value: desktopRuntime.kind }]}
      capabilities={[{ title: 'Window Controls', value: 'Available' }]}
    />
    <BrowserProfileActions
      onClear={() => undefined}
      onOpen={() => undefined}
      onVerify={() => undefined}
    />
    <LocalStatusPage
      rows={[['Runtime', desktopRuntime.kind]]}
      localRows={[['User Data', 'C:/Users/example/AppData']]}
    />
    <PageSurface>{webRuntime.kind}</PageSurface>
  </AppRuntimeProvider>
);

testLogger.warn({
  details: redactObservableDetails({
    cookie: 'session=value',
    route: '/settings',
    screenshotBase64: 'raw-image',
  }),
  event: 'runtime.status',
  message: 'Runtime status changed',
  scope: 'app-shell.test',
});

isSafeDiagnosticsHref('/diagnostics/browser/diag-1');
isSafeDiagnosticsHref('https://example.test/diagnostics/diag-1');
