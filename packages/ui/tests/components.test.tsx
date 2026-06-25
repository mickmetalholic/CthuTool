import type * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  IconButton,
  MetadataList,
  MetricTile,
  Notice,
  Separator,
  StatusBadge,
  StatusList,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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

describe('shared UI components', () => {
  it('renders button variants and preserves click and disabled behavior', () => {
    const onClick = vi.fn();
    const container = render(
      <>
        <Button
          className="custom-button"
          size="sm"
          type="button"
          variant="outline"
          onClick={onClick}
        >
          Save
        </Button>
        <Button disabled type="button" onClick={onClick}>
          Disabled
        </Button>
      </>,
    );

    const [save, disabled] = Array.from(container.querySelectorAll('button'));
    expect(save?.dataset.slot).toBe('button');
    expect(save?.dataset.size).toBe('sm');
    expect(save?.dataset.variant).toBe('outline');
    expect(save?.className).toContain('custom-button');
    act(() => save?.click());
    act(() => disabled?.click());

    expect(disabled?.disabled).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders icon buttons with accessible labels and safe defaults', () => {
    const onClick = vi.fn();
    const container = render(
      <IconButton aria-label="Refresh status" onClick={onClick}>
        R
      </IconButton>,
    );

    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Refresh status');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.dataset.slot).toBe('icon-button');
    expect(button?.dataset.size).toBe('icon');
    expect(button?.dataset.variant).toBe('ghost');

    act(() => button?.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders badges, notices, and empty states with semantic slots', () => {
    const container = render(
      <>
        <Badge variant="secondary">Synced</Badge>
        <StatusBadge status="success">Ready</StatusBadge>
        <Notice title="Saved" variant="success">
          Settings were persisted.
        </Notice>
        <EmptyState title="No tasks">Create one to continue.</EmptyState>
      </>,
    );

    expect(
      (container.querySelector('[data-slot="badge"]') as HTMLElement | null)
        ?.dataset.variant,
    ).toBe('secondary');
    expect(
      (
        container.querySelector(
          '[data-slot="status-badge"]',
        ) as HTMLElement | null
      )?.dataset.status,
    ).toBe('success');
    expect(
      (container.querySelector('[data-slot="notice"]') as HTMLElement | null)
        ?.dataset.variant,
    ).toBe('success');
    expect(text(container)).toContain('Saved');
    expect(text(container)).toContain('No tasks');
  });

  it('renders metadata and status rows from tuple and object inputs', () => {
    const container = render(
      <>
        <MetadataList
          rows={[
            ['Runtime', 'Desktop'],
            { label: 'Config', value: '/tmp/config.json' },
          ]}
        />
        <StatusList
          rows={[
            ['Queue', 'Idle'],
            { label: 'Backend', status: 'connected', value: 'Online' },
          ]}
        />
      </>,
    );

    expect(
      container.querySelectorAll('[data-slot="metadata-row"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-slot="status-list-row"]'),
    ).toHaveLength(2);
    expect(text(container)).toContain('Runtime');
    expect(text(container)).toContain('/tmp/config.json');
    expect(text(container)).toContain('connected');
    expect(text(container)).toContain('Online');
  });

  it('renders metric, card, and table composition primitives', () => {
    const container = render(
      <>
        <MetricTile label="Agents" meta="online" value="3" />
        <Card>
          <CardHeader>
            <CardTitle>Connection</CardTitle>
            <CardDescription>Backend status</CardDescription>
          </CardHeader>
          <CardContent>Connected</CardContent>
          <CardFooter>Updated now</CardFooter>
        </Card>
        <Table>
          <TableCaption>Agent list</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>desktop</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>,
    );

    expect(container.querySelector('[data-slot="metric-tile"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="card"]')).not.toBeNull();
    expect(
      container.querySelector('[data-slot="table-wrapper"]'),
    ).not.toBeNull();
    expect(text(container)).toContain('Agents');
    expect(text(container)).toContain('Connection');
    expect(text(container)).toContain('Agent list');
    expect(text(container)).toContain('desktop');
  });

  it('renders tabs with active trigger and default content', () => {
    const container = render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="settings">Settings content</TabsContent>
      </Tabs>,
    );

    expect(text(container)).toContain('Overview content');
    expect(text(container)).not.toContain('Settings content');

    const triggers = Array.from(
      container.querySelectorAll('[role="tab"]'),
    ) as HTMLElement[];
    expect(triggers.map((trigger) => trigger.textContent)).toEqual([
      'Overview',
      'Settings',
    ]);
    expect(triggers[0]?.getAttribute('data-state')).toBe('active');
    expect(triggers[1]?.getAttribute('data-state')).toBe('inactive');
  });

  it('renders separators with orientation metadata', () => {
    const container = render(
      <>
        <Separator />
        <Separator orientation="vertical" />
      </>,
    );

    const separators = Array.from(container.querySelectorAll('[data-slot]'));
    expect(
      separators.map((separator) => separator.getAttribute('data-slot')),
    ).toEqual(['separator', 'separator']);
    expect(separators[0]?.getAttribute('data-orientation')).toBe('horizontal');
    expect(separators[1]?.getAttribute('data-orientation')).toBe('vertical');
  });
});
