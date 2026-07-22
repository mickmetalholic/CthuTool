import { Global, Module } from '@nestjs/common';
import { OperatorAccessGuard } from './operator-access.guard';
import { SingleOperatorAccessService } from './single-operator-access.service';

@Global()
@Module({
  exports: [OperatorAccessGuard, SingleOperatorAccessService],
  providers: [OperatorAccessGuard, SingleOperatorAccessService],
})
export class OperatorAccessModule {}
