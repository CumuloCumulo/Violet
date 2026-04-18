import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest<T = unknown>(context: ExecutionContext): T {
    return context.switchToHttp().getRequest<T>();
  }
}
