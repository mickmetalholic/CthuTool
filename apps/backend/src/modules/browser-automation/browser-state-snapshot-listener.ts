import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { AgentWebSocketServer } from '../agent-registry/agent-websocket.server';
import type { BrowserStateProjectionService } from './browser-state-projection.service';

@Injectable()
export class BrowserStateSnapshotListener implements OnModuleInit {
  constructor(
    private readonly agentSocketServer: AgentWebSocketServer,
    private readonly projection: BrowserStateProjectionService,
  ) {}

  onModuleInit(): void {
    this.agentSocketServer.setBrowserStateSnapshotHandler((agentId, snapshot) =>
      this.projection.replaceAgentSnapshot(agentId, snapshot),
    );
  }
}
