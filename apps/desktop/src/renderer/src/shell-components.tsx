import { Button } from '@cthutool/ui';
import {
  type LucideIcon,
  Maximize2,
  Minus,
  Settings,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

export type ShellNavItem = {
  readonly badgeCount?: number;
  readonly icon: LucideIcon;
  readonly id: string;
  readonly label: string;
};

export function StartupIntro({ appIcon }: { readonly appIcon: string }) {
  return (
    <div
      aria-hidden="true"
      className="startup-intro"
      data-testid="startup-intro"
    >
      <div className="startup-intro-mark">
        <img
          alt=""
          data-testid="startup-intro-icon"
          draggable={false}
          src={appIcon}
        />
      </div>
    </div>
  );
}

export function DesktopTitlebar({
  appIcon,
  onWindowAction,
}: {
  readonly appIcon: string;
  readonly onWindowAction?: (action: 'minimize' | 'maximize' | 'close') => void;
}) {
  return (
    <header className="titlebar">
      <div className="titlebar-drag-region">
        <img alt="" className="app-icon" src={appIcon} />
        <div className="app-title">
          <strong>CthuDesktop</strong>
        </div>
      </div>
      <div className="window-controls">
        <Button
          aria-label="Minimize"
          className="window-button"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => onWindowAction?.('minimize')}
        >
          <Minus size={14} />
        </Button>
        <Button
          aria-label="Maximize"
          className="window-button"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => onWindowAction?.('maximize')}
        >
          <Maximize2 size={13} />
        </Button>
        <Button
          aria-label="Close"
          className="window-button close"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => onWindowAction?.('close')}
        >
          <X size={15} />
        </Button>
      </div>
    </header>
  );
}

export function ActivityBar({
  items,
  onSelectMain,
  onSelectSettings,
  selectedId,
  settingsActive,
}: {
  readonly items: readonly ShellNavItem[];
  readonly onSelectMain: (id: string) => void;
  readonly onSelectSettings: () => void;
  readonly selectedId: string;
  readonly settingsActive: boolean;
}) {
  return (
    <nav className="activity-bar" aria-label="Primary">
      <div className="activity-group">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = selectedId === item.id;
          return (
            <button
              aria-label={item.label}
              className={
                selected ? 'activity-button active' : 'activity-button'
              }
              key={item.id}
              type="button"
              onClick={() => onSelectMain(item.id)}
            >
              <Icon size={20} />
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className="activity-badge">{item.badgeCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <button
        aria-label="Settings"
        className={
          settingsActive
            ? 'activity-button active settings-button'
            : 'activity-button settings-button'
        }
        type="button"
        onClick={onSelectSettings}
      >
        <Settings size={20} />
      </button>
    </nav>
  );
}

export function SettingsSubnav({
  active,
  items,
  onSelect,
}: {
  readonly active: string;
  readonly items: readonly Pick<ShellNavItem, 'id' | 'label'>[];
  readonly onSelect: (id: string) => void;
}) {
  return (
    <aside className="subnav">
      <div className="subnav-heading">
        <span>Settings</span>
      </div>
      <div className="submenu">
        {items.map((item) => (
          <button
            className={
              active === item.id ? 'submenu-item active' : 'submenu-item'
            }
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export function DesktopStatusBar({
  backendUrl,
  connectionStatus,
  environmentLabel,
  onOpenStatus,
  platform,
  statusLabel,
  version,
}: {
  readonly backendUrl: string;
  readonly connectionStatus: string;
  readonly environmentLabel: string;
  readonly onOpenStatus: () => void;
  readonly platform: string;
  readonly statusLabel: string;
  readonly version: string;
}) {
  return (
    <footer className="statusbar">
      <button
        aria-label="Open connection details"
        className={`statusbar-connection ${connectionStatus}`}
        type="button"
        onClick={onOpenStatus}
      >
        {connectionStatus === 'connected' ? (
          <Wifi size={13} />
        ) : (
          <WifiOff size={13} />
        )}
        <span className="statusbar-state">{statusLabel}</span>
        <span className="statusbar-context-label">{environmentLabel}</span>
        <span className="statusbar-backend">{backendUrl}</span>
      </button>
      <button
        aria-label="Open client status"
        className="statusbar-meta"
        type="button"
        onClick={onOpenStatus}
      >
        <span>{platform}</span>
        <span>v{version}</span>
      </button>
    </footer>
  );
}
