import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { AgentConsole } from './agent-console';
import { AgentPermissionHelp } from './help/page';

describe('Agent Web experience', () => {
  test('renders an accessible bootstrap landmark and live status', () => {
    const html = renderToStaticMarkup(
      createElement(AgentConsole, { deploymentEnvironment: 'prod' }),
    );
    expect(html).toContain('<main class="agent-shell">');
    expect(html).toContain('<h1>');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('href="/agent/help"');
  });

  test('renders keyboard-reachable permission remediation content', () => {
    const html = renderToStaticMarkup(createElement(AgentPermissionHelp));
    expect(html).toContain('id="permission-steps"');
    expect(html).toContain('<ol>');
    expect(html).toContain('href="/agent"');
    expect(html).toContain('不使用 WebSocket');
  });
});
