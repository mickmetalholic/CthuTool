import {
  AppRuntimeProvider,
  BrowserProfileActions,
  CapabilityGate,
  createDesktopRuntime,
  LocalStatusPage,
  MetricSummary,
  mainNavigation,
  OverviewPage,
  PageFrame,
  PageHeader,
  PageMetadataList,
  PageNotice,
  PageStatusList,
  PageSurface,
  PageToolbar,
  settingsNavigation,
  webRuntime,
} from '../src';

const desktopRuntime = createDesktopRuntime({
  windowAction: () => undefined,
});

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
