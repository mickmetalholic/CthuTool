import * as React from 'react';
import {
  AppRuntimeProvider,
  BrowserProfileActions,
  CapabilityGate,
  createDesktopRuntime,
  LocalStatusPage,
  mainNavigation,
  OverviewPage,
  PageHeader,
  PageSurface,
  settingsNavigation,
  webRuntime,
} from '../src';

const desktopRuntime = createDesktopRuntime({
  windowAction: () => undefined,
});

export const RuntimeTypeTest = () => (
  <AppRuntimeProvider runtime={desktopRuntime}>
    <PageHeader eyebrow={desktopRuntime.kind} title={mainNavigation[0].label} />
    <CapabilityGate capability="canControlWindow">
      <button type="button">{settingsNavigation[0].label}</button>
    </CapabilityGate>
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
