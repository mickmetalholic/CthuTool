import {
  parseAgentClientMessageJson,
  validateAgentClientMessage,
  validateAgentHeartbeatMessage,
  validateAgentHelloMessage,
} from './index';

describe('agent protocol validation', () => {
  const hello = {
    type: 'agent.hello',
    payload: {
      agentId: 'homelab-mac',
      deviceName: 'Homelab Mac',
      platform: 'darwin',
      version: '0.1.0',
      capabilities: [],
    },
  };

  it('accepts a valid hello message with empty capabilities', () => {
    expect(validateAgentHelloMessage(hello)).toEqual({
      ok: true,
      value: hello,
    });
  });

  it('preserves syntactically valid unknown future capabilities', () => {
    const input = {
      ...hello,
      payload: {
        ...hello.payload,
        capabilities: ['browser', 'future.capability'],
      },
    };

    expect(validateAgentHelloMessage(input)).toEqual({
      ok: true,
      value: input,
    });
  });

  it('rejects invalid registration metadata', () => {
    const result = validateAgentHelloMessage({
      ...hello,
      payload: {
        ...hello.payload,
        agentId: '../bad',
      },
    });

    expect(result.ok).toBe(false);
  });

  it('accepts heartbeat messages', () => {
    const heartbeat = {
      type: 'agent.heartbeat',
      payload: {
        agentId: 'homelab-mac',
        sentAt: '2026-06-13T12:00:00.000Z',
      },
    };

    expect(validateAgentHeartbeatMessage(heartbeat)).toEqual({
      ok: true,
      value: heartbeat,
    });
    expect(validateAgentClientMessage(heartbeat)).toEqual({
      ok: true,
      value: heartbeat,
    });
  });

  it('parses JSON client messages', () => {
    expect(parseAgentClientMessageJson(JSON.stringify(hello))).toEqual({
      ok: true,
      value: hello,
    });
    expect(parseAgentClientMessageJson('{')).toEqual({
      ok: false,
      message: 'agent message must be valid JSON',
    });
  });
});
