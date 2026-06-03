import { RedisService } from './../redis/redis.service';
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  InvalidIdempotencyKey,
  RequestProcessing,
} from '../errors/common.errors';
import { isUUID } from 'class-validator';

interface AuthenticatedRequest extends FastifyRequest {
  user?: { id: string };
}

interface CachedResponse {
  status: string;
  data: unknown;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();

    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (!isUUID(idempotencyKey)) throw InvalidIdempotencyKey;

    const userId = req.user?.id;
    const redisKey = `idempotency:${userId}:${idempotencyKey}`;

    const existing: string | null =
      await this.redisService.getIdempotencyKey(redisKey);

    if (existing) {
      // PROCESSING
      if (existing === 'PROCESSING') {
        throw RequestProcessing;
      }

      // COMPLETED
      const cached = JSON.parse(existing) as CachedResponse;
      void reply.status(HttpStatus.OK).send(cached.data);
      return new Observable((subscriber) => subscriber.complete());
    }

    const acquired = await this.redisService.setProcessing(redisKey);

    if (!acquired) throw RequestProcessing;

    return next.handle().pipe(
      tap((response) => {
        void this.redisService.setCompleted(redisKey, response);
      }),
    );
  }
}
