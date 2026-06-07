/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    if (req.user?.id) {
      return Promise.resolve(`user-${req.user.id}`);
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown-ip';

    return Promise.resolve(`ip-${ip}`);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Too many requests detected. Please wait a moment before trying again.',
    );
  }
}
