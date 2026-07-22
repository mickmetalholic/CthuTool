import { Module } from '@nestjs/common';
import { MetricsModule } from './metrics';
import { AgentModule } from './modules/agent/agent.module';
import { BrowserModule } from './modules/browser/browser.module';
import { DoubanMovieInfoModule } from './modules/douban-movie-info/douban-movie-info.module';
import { HealthModule } from './modules/health/health.module';
import { OperatorAccessModule } from './modules/operator-access/operator-access.module';
import { ObservabilityModule } from './observability';

@Module({
  imports: [
    MetricsModule,
    ObservabilityModule,
    OperatorAccessModule,
    AgentModule,
    BrowserModule,
    DoubanMovieInfoModule,
    HealthModule,
  ],
})
export class AppModule {}
