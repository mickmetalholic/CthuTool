import { Controller, Get, UseGuards } from '@nestjs/common';
import { OperatorAccessGuard } from '../../operator-access/operator-access.guard';
// Nest DI needs runtime class reference; `import type` strips it and breaks metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryService } from './agent-registry.service';

@Controller('api/agents')
@UseGuards(OperatorAccessGuard)
export class AgentRegistryController {
  constructor(private readonly registry: AgentRegistryService) {}

  @Get('/')
  listAgents() {
    return {
      agents: this.registry.listOnlineAgents(),
    };
  }
}
