import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, Optional } from '@nestjs/common';
import { SingleOperatorAccessService } from './single-operator-access.service';

@Injectable()
export class OperatorAccessGuard implements CanActivate {
  private readonly access: SingleOperatorAccessService;

  constructor(@Optional() access?: SingleOperatorAccessService) {
    this.access = access ?? new SingleOperatorAccessService();
  }

  canActivate(context: ExecutionContext): boolean {
    this.access.assertOperator(context.switchToHttp().getRequest());
    return true;
  }
}
