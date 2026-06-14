export type MainRouteId = 'agents' | 'browser' | 'overview';
export type SettingsRouteId =
  | 'appearance'
  | 'diagnostics'
  | 'logs'
  | 'service'
  | 'status';

export type NavigationArea = 'main' | 'settings';
export type NavigationIcon =
  | 'appearance'
  | 'browser'
  | 'diagnostics'
  | 'home'
  | 'logs'
  | 'service'
  | 'status'
  | 'agents';

export type NavigationItem = {
  readonly area: NavigationArea;
  readonly id: MainRouteId | SettingsRouteId;
  readonly icon: NavigationIcon;
  readonly label: string;
};

export const mainNavigation: readonly NavigationItem[] = [
  { area: 'main', icon: 'home', id: 'overview', label: 'Overview' },
  { area: 'main', icon: 'browser', id: 'browser', label: 'Browser Profiles' },
  { area: 'main', icon: 'agents', id: 'agents', label: 'Agents' },
] as const;

export const settingsNavigation: readonly NavigationItem[] = [
  { area: 'settings', icon: 'service', id: 'service', label: 'Service' },
  { area: 'settings', icon: 'status', id: 'status', label: 'Status' },
  {
    area: 'settings',
    icon: 'diagnostics',
    id: 'diagnostics',
    label: 'Diagnostics',
  },
  { area: 'settings', icon: 'logs', id: 'logs', label: 'Logs' },
  {
    area: 'settings',
    icon: 'appearance',
    id: 'appearance',
    label: 'Appearance',
  },
] as const;
