import type * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  AppRuntimeProvider,
  AppShellFrame,
  BrowserProfileActions,
  CapabilityGate,
  createDesktopRuntime,
  LocalStatusPage,
  MetricSummary,
  OverviewPage,
  PageFrame,
  PageToolbar,
  webRuntime,
} from '../src';

type MountedRoot = {
  readonly container: HTMLElement;
  readonly root: Root;
};

const mountedRoots: MountedRoot[] = [];

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  for (const mounted of mountedRoots.splice(0)) {
    act(() => mounted.root.unmount());
    mounted.container.remove();
  }
});

function render(element: React.ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(element));
  mountedRoots.push({ container, root });
  return container;
}

function text(container: HTMLElement): string {
  return container.textContent ?? '';
}

describe('app shell rendered behavior', () => {
  it('provides runtime capabilities to capability gates', () => {
    function RuntimeProbe() {
      return (
        <>
          <CapabilityGate
            capability="canControlWindow"
            fallback={<span>cannot-control</span>}
          >
            <span>can-control</span>
          </CapabilityGate>
          <CapabilityGate
            capability="canUseLocalBrowserProfiles"
            fallback={<span>no-profiles</span>}
          >
            <span>profiles</span>
          </CapabilityGate>
        </>
      );
    }

    const webContainer = render(
      <AppRuntimeProvider runtime={webRuntime}>
        <RuntimeProbe />
      </AppRuntimeProvider>,
    );
    expect(text(webContainer)).toContain('cannot-control');
    expect(text(webContainer)).toContain('no-profiles');

    const desktopContainer = render(
      <AppRuntimeProvider
        runtime={createDesktopRuntime({
          openBrowserLogin: async () => undefined,
          windowAction: () => undefined,
        })}
      >
        <RuntimeProbe />
      </AppRuntimeProvider>,
    );
    expect(text(desktopContainer)).toContain('can-control');
    expect(text(desktopContainer)).toContain('profiles');
  });

  it('disables browser profile actions when runtime cannot use host profiles', () => {
    const onClear = vi.fn();
    const onOpen = vi.fn();
    const onVerify = vi.fn();

    const container = render(
      <AppRuntimeProvider runtime={webRuntime}>
        <BrowserProfileActions
          onClear={onClear}
          onOpen={onOpen}
          onVerify={onVerify}
        />
      </AppRuntimeProvider>,
    );

    for (const button of Array.from(container.querySelectorAll('button'))) {
      expect(button.disabled).toBe(true);
      act(() => button.click());
    }

    expect(onClear).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
    expect(onVerify).not.toHaveBeenCalled();
  });

  it('emits browser profile action callbacks for desktop runtimes', () => {
    const onClear = vi.fn();
    const onOpen = vi.fn();
    const onVerify = vi.fn();

    const container = render(
      <AppRuntimeProvider
        runtime={createDesktopRuntime({
          verifyBrowserProfile: async () => undefined,
        })}
      >
        <BrowserProfileActions
          onClear={onClear}
          onOpen={onOpen}
          onVerify={onVerify}
        />
      </AppRuntimeProvider>,
    );

    const [open, verify, clear] = Array.from(
      container.querySelectorAll('button'),
    );
    act(() => open?.click());
    act(() => verify?.click());
    act(() => clear?.click());

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onVerify).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('renders local status fallback unless local paths are available', () => {
    const webContainer = render(
      <LocalStatusPage
        localRows={[['Config Path', '/tmp/config.json']]}
        rows={[['Runtime', 'Web']]}
      />,
    );
    expect(text(webContainer)).toContain('Runtime');
    expect(text(webContainer)).toContain('Web');
    expect(text(webContainer)).toContain('Local Paths');
    expect(text(webContainer)).toContain('Unavailable in this runtime');
    expect(text(webContainer)).not.toContain('/tmp/config.json');

    const desktopContainer = render(
      <AppRuntimeProvider runtime={createDesktopRuntime({})}>
        <LocalStatusPage
          localRows={[['Config Path', '/tmp/config.json']]}
          rows={[['Runtime', 'Desktop']]}
        />
      </AppRuntimeProvider>,
    );
    expect(text(desktopContainer)).toContain('Desktop');
    expect(text(desktopContainer)).toContain('/tmp/config.json');
    expect(text(desktopContainer)).not.toContain('Unavailable in this runtime');
  });

  it('renders overview metrics and capability fallback values', () => {
    const container = render(
      <OverviewPage
        capabilities={[
          { title: 'Browser profiles', value: 'Ready' },
          { muted: true, title: 'Local files', value: 'Unavailable' },
        ]}
        metrics={[
          { label: 'Agents', value: '2' },
          { label: 'Latency', value: '' },
        ]}
      />,
    );

    expect(text(container)).toContain('Agents');
    expect(text(container)).toContain('2');
    expect(text(container)).toContain('Latency');
    expect(text(container)).toContain('Unknown');
    expect(text(container)).toContain('Browser profiles');
    expect(text(container)).toContain('Unavailable');
    expect(container.querySelector('.capability-card.muted')).not.toBeNull();
  });

  it('composes shell frame, page frame, toolbar, and metric summary slots', () => {
    const container = render(
      <AppShellFrame
        activity={<nav>Primary</nav>}
        status={<span>Connected</span>}
        subnav={<nav>Settings</nav>}
        titlebar={<span>CthuDesktop</span>}
      >
        <PageFrame
          description="System health"
          eyebrow="Status"
          title="Overview"
          toolbar={
            <PageToolbar end={<button type="button">Refresh</button>}>
              <button type="button">Create</button>
            </PageToolbar>
          }
        >
          <MetricSummary
            metrics={[
              { label: 'Agents', meta: 'online', value: '3' },
              { label: 'Tasks', value: '8' },
            ]}
          />
        </PageFrame>
      </AppShellFrame>,
    );

    expect(container.querySelector('[data-slot="app-shell-frame"]')).not.toBe(
      null,
    );
    expect(container.querySelector('[data-slot="page-frame"]')).not.toBe(null);
    expect(text(container)).toContain('CthuDesktop');
    expect(text(container)).toContain('Overview');
    expect(text(container)).toContain('System health');
    expect(text(container)).toContain('Refresh');
    expect(text(container)).toContain('Agents');
    expect(text(container)).toContain('online');
  });
});
