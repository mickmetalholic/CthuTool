import { Button } from '@cthutool/ui';
import * as React from 'react';
import { useAppRuntime } from './runtime';

export function BrowserProfileActions({
  disabled = false,
  onClear,
  onOpen,
  onVerify,
}: {
  readonly disabled?: boolean;
  readonly onClear: () => void;
  readonly onOpen: () => void;
  readonly onVerify: () => void;
}) {
  const runtime = useAppRuntime();
  const canUseHostActions =
    runtime.capabilities.canUseLocalBrowserProfiles ||
    runtime.kind === 'desktop';
  const disabledByRuntime = disabled || !canUseHostActions;

  return (
    <div className="site-actions">
      <Button
        disabled={disabledByRuntime}
        size="sm"
        type="button"
        variant="outline"
        onClick={onOpen}
      >
        Open
      </Button>
      <Button
        disabled={disabledByRuntime}
        size="sm"
        type="button"
        variant="outline"
        onClick={onVerify}
      >
        Verify
      </Button>
      <Button
        disabled={disabledByRuntime}
        size="sm"
        type="button"
        variant="outline"
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
}
