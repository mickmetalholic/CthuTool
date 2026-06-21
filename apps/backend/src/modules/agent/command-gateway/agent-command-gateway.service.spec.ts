import {
  createJsonRpcErrorResponse,
  createJsonRpcRequest,
  createJsonRpcSuccessResponse,
  JSON_RPC_INVALID_PARAMS,
} from '@cthutool/agent-protocol';
import type { Mock } from 'vitest';
import { AgentRegistryService } from '../registry/agent-registry.service';
import type { AgentWebSocketServer } from '../websocket/agent-websocket.server';
import {
  AgentCommandGateway,
  AgentCommandGatewayError,
  type AgentCommandRequest,
  type AgentCommandResponse,
} from './agent-command-gateway.service';

describe('AgentCommandGateway', () => {
  it('selects an online agent by capability and dispatches a typed command', async () => {
    const socket = createSocketMock();
    const gateway = createGateway(socket);
    const command = createCommandRequest('cmd-1');

    const result = await gateway.sendCommandByCapability('browser', command);

    expect(socket.sendCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({ id: 'cmd-1', method: 'test.echo' }),
      undefined,
    );
    expect(result.id).toBe('cmd-1');
  });

  it('returns structured errors when a capability is missing', async () => {
    const gateway = createGateway(createSocketMock(), false);

    await expect(
      gateway.sendCommandByCapability('browser', createCommandRequest('cmd-1')),
    ).rejects.toBeInstanceOf(AgentCommandGatewayError);
  });

  it('passes command errors through as correlated command results', async () => {
    const response = createJsonRpcErrorResponse('cmd-1', {
      code: JSON_RPC_INVALID_PARAMS,
      message: 'Invalid params',
      data: { code: 'ANY_APPLICATION_ERROR' },
    });
    const gateway = createGateway(createSocketMock(response));

    await expect(
      gateway.sendCommand('agent-1', createCommandRequest('cmd-1')),
    ).resolves.toEqual(response);
  });

  it('attaches observability metadata before dispatching commands', async () => {
    const socket = createSocketMock();
    const gateway = createGateway(socket);

    await gateway.sendCommand('agent-1', {
      ...createCommandRequest('cmd-1'),
      observability: {
        commandId: 'cmd-1',
        operation: 'browser.capturePage',
        requestId: 'req-1',
      },
    });

    expect(socket.sendCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({
        id: 'cmd-1',
        method: 'test.echo',
        observability: {
          commandId: 'cmd-1',
          operation: 'browser.capturePage',
          requestId: 'req-1',
        },
      }),
      undefined,
    );
  });

  it('emits command dispatch and completion events', async () => {
    const observability = { record: vi.fn() };
    const metrics = createMetricsMock();
    const socket = createSocketMock();
    const gateway = createGateway(socket, true, observability, metrics);

    await gateway.sendCommand('agent-1', createCommandRequest('cmd-1'));

    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'agent.command_dispatched',
        details: expect.objectContaining({
          commandId: 'cmd-1',
          commandType: 'test.echo',
        }),
      }),
    );
    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'agent.command_completed',
        details: expect.objectContaining({
          commandId: 'cmd-1',
          responseType: 'jsonrpc.result',
        }),
      }),
    );
    expect(metrics.recordAgentCommandDispatched).toHaveBeenCalledWith({
      commandType: undefined,
    });
    expect(metrics.recordAgentCommandCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        commandType: undefined,
        responseType: 'agent.commandResult',
      }),
    );
  });

  it('emits command failure events', async () => {
    const observability = { record: vi.fn() };
    const metrics = createMetricsMock();
    const gateway = createGateway(
      createSocketMockWithImplementation(async () => {
        throw new Error('socket closed');
      }),
      true,
      observability,
      metrics,
    );

    await expect(
      gateway.sendCommand('agent-1', createCommandRequest('cmd-1')),
    ).rejects.toMatchObject({ code: 'AGENT_NOT_AVAILABLE' });

    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'agent.command_failed',
        details: expect.objectContaining({
          commandId: 'cmd-1',
          errorCode: 'AGENT_NOT_AVAILABLE',
        }),
      }),
    );
    expect(metrics.recordAgentCommandFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        commandType: undefined,
        errorCode: 'AGENT_NOT_AVAILABLE',
      }),
    );
  });

  it('maps transport failures to gateway availability errors', async () => {
    const gateway = createGateway(
      createSocketMockWithImplementation(async () => {
        throw new Error('socket closed');
      }),
    );

    await expect(
      gateway.sendCommand('agent-1', createCommandRequest('cmd-1')),
    ).rejects.toMatchObject({
      code: 'AGENT_NOT_AVAILABLE',
      message: 'socket closed',
    });
  });
});

type SocketMock = {
  readonly sendCommand: Mock;
};

function createGateway(
  socket: SocketMock = createSocketMock(),
  registerAgent = true,
  observability?: { readonly record: Mock },
  metrics?: ReturnType<typeof createMetricsMock>,
): AgentCommandGateway {
  const registry = new AgentRegistryService();
  if (registerAgent) {
    registry.register({
      connectionId: 'connection-1',
      hello: {
        agentId: 'agent-1',
        capabilities: ['browser'],
        deviceName: 'desktop',
        platform: 'win32',
        version: '0.0.0',
      },
    });
  }
  return new AgentCommandGateway(
    registry,
    socket as unknown as AgentWebSocketServer,
    observability as never,
    metrics as never,
  );
}

function createMetricsMock() {
  return {
    recordAgentCommandCompleted: vi.fn(),
    recordAgentCommandDispatched: vi.fn(),
    recordAgentCommandFailed: vi.fn(),
  };
}

function createSocketMock(
  response: AgentCommandResponse = createCommandResponse('cmd-1'),
): SocketMock {
  return createSocketMockWithImplementation(async () => response);
}

function createSocketMockWithImplementation(
  implementation: () => Promise<AgentCommandResponse>,
): SocketMock {
  return {
    sendCommand: vi.fn(implementation),
  };
}

function createCommandRequest(commandId: string): AgentCommandRequest {
  return createJsonRpcRequest({
    id: commandId,
    method: 'test.echo',
    params: { ok: true },
  });
}

function createCommandResponse(commandId: string): AgentCommandResponse {
  return createJsonRpcSuccessResponse(commandId, { ok: true });
}
