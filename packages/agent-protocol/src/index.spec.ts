import {
  AGENT_CLIENT_LIFECYCLE_MESSAGE_TYPES,
  AGENT_LIFECYCLE_MESSAGE_TYPES,
  AGENT_SERVER_LIFECYCLE_MESSAGE_TYPES,
  createAgentErrorMessage,
  createAgentRegisteredMessage,
  createJsonRpcErrorResponse,
  createJsonRpcRequest,
  createJsonRpcSuccessResponse,
  isAgentLifecycleMessage,
  isJsonRpcErrorResponse,
  JSON_RPC_INVALID_PARAMS,
  parseAgentClientMessageJson,
  parseAgentServerMessageJson,
  validateAgentClientMessage,
  validateAgentHeartbeatMessage,
  validateAgentHelloMessage,
  validateAgentServerMessage,
  validateJsonRpcRequest,
  validateJsonRpcResponse,
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

  it('normalizes lifecycle message type constants', () => {
    expect(AGENT_LIFECYCLE_MESSAGE_TYPES).toEqual([
      'agent.hello',
      'agent.heartbeat',
      'agent.registered',
      'agent.error',
    ]);
    expect(AGENT_CLIENT_LIFECYCLE_MESSAGE_TYPES).toEqual([
      'agent.hello',
      'agent.heartbeat',
    ]);
    expect(AGENT_SERVER_LIFECYCLE_MESSAGE_TYPES).toEqual([
      'agent.registered',
      'agent.error',
    ]);
  });

  it('accepts a valid hello message with empty capabilities', () => {
    expect(validateAgentHelloMessage(hello)).toEqual({
      ok: true,
      value: hello,
    });
  });

  it('preserves syntactically valid unknown future capabilities as metadata', () => {
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
    expect(isAgentLifecycleMessage(heartbeat)).toBe(true);
  });

  it('parses JSON client lifecycle messages', () => {
    expect(parseAgentClientMessageJson(JSON.stringify(hello))).toEqual({
      ok: true,
      value: hello,
    });
    expect(parseAgentClientMessageJson('{')).toEqual({
      ok: false,
      message: 'agent message must be valid JSON',
    });
  });

  it('accepts server lifecycle messages', () => {
    const registered = createAgentRegisteredMessage(
      'homelab-mac',
      '2026-06-13T12:00:00.000Z',
    );
    const error = createAgentErrorMessage('BAD_HELLO', 'Invalid hello');

    expect(validateAgentServerMessage(registered)).toEqual({
      ok: true,
      value: registered,
    });
    expect(validateAgentServerMessage(error)).toEqual({
      ok: true,
      value: error,
    });
  });

  it('accepts optional observability metadata on lifecycle messages', () => {
    const heartbeat = {
      type: 'agent.heartbeat',
      payload: {
        agentId: 'homelab-mac',
        observability: {
          requestId: 'req-1',
          traceId: 'trace-1',
          operation: 'agent.heartbeat',
        },
      },
    };

    expect(validateAgentHeartbeatMessage(heartbeat)).toEqual({
      ok: true,
      value: heartbeat,
    });
  });

  it('accepts JSON-RPC command requests from the server', () => {
    const request = createJsonRpcRequest({
      id: 'cmd-1',
      method: 'browser.capturePage',
      params: {
        siteId: 'douban',
        url: 'https://movie.douban.com/subject/1292052/',
      },
      observability: {
        commandId: 'cmd-1',
        operation: 'browser.capturePage',
        requestId: 'req-1',
      },
    });

    expect(validateJsonRpcRequest(request)).toEqual({
      ok: true,
      value: request,
    });
    expect(validateAgentServerMessage(request)).toEqual({
      ok: true,
      value: request,
    });
    expect(parseAgentServerMessageJson(JSON.stringify(request))).toEqual({
      ok: true,
      value: request,
    });
  });

  it('accepts JSON-RPC success and error responses from the client', () => {
    const success = createJsonRpcSuccessResponse(
      'cmd-1',
      {
        ok: true,
      },
      {
        commandId: 'cmd-1',
        operation: 'browser.capturePage',
        requestId: 'req-1',
      },
    );
    const failure = createJsonRpcErrorResponse(
      'cmd-2',
      {
        code: JSON_RPC_INVALID_PARAMS,
        message: 'Invalid params',
        data: {
          code: 'INVALID_BROWSER_COMMAND',
        },
      },
      {
        commandId: 'cmd-2',
        operation: 'browser.capturePage',
        requestId: 'req-1',
      },
    );

    expect(validateJsonRpcResponse(success)).toEqual({
      ok: true,
      value: success,
    });
    expect(validateAgentClientMessage(success)).toEqual({
      ok: true,
      value: success,
    });
    expect(validateAgentClientMessage(failure)).toEqual({
      ok: true,
      value: failure,
    });
    expect(isJsonRpcErrorResponse(failure)).toBe(true);
  });

  it('rejects unsupported observability metadata fields', () => {
    expect(
      validateAgentServerMessage({
        jsonrpc: '2.0',
        id: 'cmd-1',
        method: 'browser.capturePage',
        observability: {
          requestId: 'req-1',
          rawHeaders: {},
        },
      }).ok,
    ).toBe(false);
  });

  it('rejects browser-specific legacy messages in the generic agent protocol', () => {
    expect(
      validateAgentClientMessage({
        type: 'browser.stateSnapshot',
        payload: {
          agentId: 'homelab-mac',
          profiles: [],
          pendingAuthTasks: [],
        },
      }).ok,
    ).toBe(false);
    expect(
      validateAgentServerMessage({
        type: 'browser.command',
        payload: {
          command: 'browser.capturePage',
          commandId: 'cmd-1',
          siteId: 'douban',
        },
      }).ok,
    ).toBe(false);
  });
});
