import { Injectable, type OnModuleInit } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentWebSocketServer } from '../agent-registry/agent-websocket.server';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentStateProjectionService } from './agent-state-projection.service';

@Injectable()
export class AgentStateSnapshotListener implements OnModuleInit {
  constructor(
    private readonly agentSocketServer: AgentWebSocketServer,
    private readonly projection: AgentStateProjectionService,
  ) {}

  onModuleInit(): void {
    this.agentSocketServer.setBrowserStateSnapshotHandler((agentId, snapshot) =>
      this.projection.replaceBrowserSnapshot(agentId, snapshot),
    );
  }
}
