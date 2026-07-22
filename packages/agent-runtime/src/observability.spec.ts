import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  AgentObservabilityRecorder,
  createAgentObservabilityEvent,
  FileAgentObservabilityRecorder,
  sanitizeDiagnosticText,
  sanitizeObservabilityDetails,
} from './observability';

describe('agent observability redaction', () => {
  test('allowlists structured fields and removes URL credentials', () => {
    const details = sanitizeObservabilityDetails({
      backendUrl:
        'https://admin:password@backend.example.com/api?token=raw-secret#fragment',
      commandId: 'cmd-1',
      lastError: 'Authorization: Bearer reusable-token',
      rawProfile: { cookie: 'raw-cookie' },
      ticket: 'local-ticket',
    } as never);

    expect(details).toEqual({
      backendUrl: 'https://backend.example.com/api',
      commandId: 'cmd-1',
      lastError: 'Authorization=[REDACTED] [REDACTED]',
    });
    expect(JSON.stringify(details)).not.toMatch(
      /password|raw-secret|raw-cookie|local-ticket|reusable-token/,
    );
  });

  test('redacts secret-shaped text and bounds event payloads', () => {
    const message = sanitizeDiagnosticText(
      `cookie=session-value ${'x'.repeat(800)}`,
    );
    expect(message).toContain('cookie=[REDACTED]');
    expect(message.length).toBeLessThanOrEqual(512);
  });

  test('recorder re-sanitizes events and keeps a bounded snapshot', () => {
    const recorder = new AgentObservabilityRecorder({ maxEvents: 1 });
    recorder.record(
      createAgentObservabilityEvent({
        details: { reasonCode: 'token=secret-value' },
        event: 'agent.socket_error',
        message: 'password=hunter2',
      }),
    );
    recorder.emit({
      event: 'agent.reconnecting',
      message: 'Connection retry scheduled',
    });

    expect(recorder.snapshot().recentEvents).toHaveLength(1);
    expect(JSON.stringify(recorder.snapshot())).not.toMatch(
      /secret-value|hunter2/,
    );
  });

  test('writes a user-private redacted Agent-owned JSON-lines log', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-agent-log-'));
    const path = join(root, 'logs', 'agent.log');
    try {
      const recorder = new FileAgentObservabilityRecorder({ path });
      recorder.record(
        createAgentObservabilityEvent({
          details: {
            backendUrl: 'https://user:password@example.com/agent?token=private',
          },
          event: 'agent.socket_error',
          message: 'Authorization: Bearer reusable-secret',
        }),
      );
      const contents = await readFile(path, 'utf8');
      expect(contents).toContain('agent.socket_error');
      expect(contents).not.toMatch(/password|private|reusable-secret/);
      if (process.platform !== 'win32') {
        expect((await stat(path)).mode & 0o077).toBe(0);
      }
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
