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
  isJsonRpcRequest,
  isJsonRpcResponse,
  JSON_RPC_INVALID_PARAMS,
  parseAgentClientMessageJson,
  parseAgentLifecycleMessage,
  parseAgentServerMessageJson,
  validateAgentClientLifecycleMessage,
  validateAgentClientMessage,
  validateAgentHeartbeatMessage,
  validateAgentHelloMessage,
  validateAgentServerLifecycleMessage,
  validateAgentServerMessage,
  validateJsonRpcRequest,
  validateJsonRpcResponse,
} from './index';

describe('agent protocol validation', () => {
  const hello = {
    type: 'agent.hello',
    payload: {
      environmentId: 'prod',
      agentId: 'homelab-mac',
      protocolVersion: 1,
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
        environmentId: 'prod',
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
    expect(validateAgentClientLifecycleMessage(heartbeat)).toEqual({
      ok: true,
      value: heartbeat,
    });
    expect(parseAgentLifecycleMessage(heartbeat)).toEqual({
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
    const registered = createAgentRegisteredMessage({
      environmentId: 'prod',
      agentId: 'homelab-mac',
      connectionGeneration: 2,
      serverTime: '2026-06-13T12:00:00.000Z',
    });
    const error = createAgentErrorMessage('BAD_HELLO', 'Invalid hello');

    expect(validateAgentServerMessage(registered)).toEqual({
      ok: true,
      value: registered,
    });
    expect(validateAgentServerLifecycleMessage(registered)).toEqual({
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
        environmentId: 'prod',
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
      routing: {
        environmentId: 'prod',
        agentId: 'homelab-mac',
        connectionGeneration: 2,
      },
    });

    expect(validateJsonRpcRequest(request)).toEqual({
      ok: true,
      value: request,
    });
    expect(isJsonRpcRequest(request)).toBe(true);
    expect(validateAgentServerMessage(request)).toEqual({
      ok: true,
      value: request,
    });
    expect(parseAgentServerMessageJson(JSON.stringify(request))).toEqual({
      ok: true,
      value: request,
    });
    expect(parseAgentServerMessageJson('{')).toEqual({
      ok: false,
      message: 'agent server message must be valid JSON',
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
    expect(isJsonRpcResponse(success)).toBe(true);
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

  it('omits optional JSON-RPC fields when they are not provided', () => {
    const request = createJsonRpcRequest({
      id: 1,
      method: 'agent.ping',
    });
    const success = createJsonRpcSuccessResponse(1, null);
    const failure = createJsonRpcErrorResponse(1, {
      code: JSON_RPC_INVALID_PARAMS,
      message: 'Invalid params',
    });

    expect(request).toEqual({
      jsonrpc: '2.0',
      id: 1,
      method: 'agent.ping',
    });
    expect(success).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: null,
    });
    expect(failure).toEqual({
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: JSON_RPC_INVALID_PARAMS,
        message: 'Invalid params',
      },
    });
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
    expect(
      validateAgentServerMessage({
        jsonrpc: '2.0',
        id: 'cmd-1',
        method: 'browser.capturePage',
        params: {
          nested: {
            observability: {
              rawHeaders: {},
            },
          },
        },
      }).ok,
    ).toBe(false);
    expect(
      validateAgentServerMessage({
        jsonrpc: '2.0',
        id: 'cmd-1',
        method: 'browser.capturePage',
        observability: null,
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

  it('rejects secret-shaped lifecycle and public error metadata', () => {
    expect(
      parseAgentLifecycleMessage({
        ...hello,
        payload: { ...hello.payload, agentSecret: 'not-public' },
      }).ok,
    ).toBe(false);
    expect(
      validateAgentHelloMessage({
        ...hello,
        payload: { ...hello.payload, operatorSession: 'not-public' },
      }).ok,
    ).toBe(false);
    expect(
      validateAgentClientMessage({
        jsonrpc: '2.0',
        id: 'cmd-1',
        error: {
          code: -32603,
          message: 'failed',
          data: { authorization: 'Bearer not-public' },
        },
      }).ok,
    ).toBe(false);
    expect(
      validateJsonRpcResponse({
        jsonrpc: '2.0',
        id: 'cmd-1',
        error: {
          code: -32603,
          message: 'failed',
          data: { bridgeTicket: 'not-public' },
        },
      }).ok,
    ).toBe(false);
  });
});
