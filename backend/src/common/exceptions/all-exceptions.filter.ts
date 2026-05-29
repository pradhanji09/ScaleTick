import { ErrorResponse } from './exceptions.types';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { RestError } from '../errors/rest-error.provider';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let message = 'Something went wrong please try again later';
    let code = 'INTERNAL_SERVER_ERROR';
    let errors: string[] | null = null;

    if (exception instanceof RestError) {
      // Our custom domain errors
      statusCode = exception.getStatus();
      title = exception.title;
      message = exception.message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      // NestJS built-in exceptions (validation etc)

      statusCode = exception.getStatus();
      const response = exception.getResponse();
      title = 'Request Failed';
      code = 'REQUEST_FAILED';
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object') {
        const responseObj = response as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          code = 'VALIDATION_FAILED';
          title = 'Validation Error';
          errors = responseObj.message as string[];
        } else {
          message = responseObj.message as string;
        }
      }
    } else {
      // Log unexpected runtime exceptions (500s) with stack trace safely
      const error =
        exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(`Unhandled Exception: ${error.message}`, error.stack);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      title,
      message,
      code,
      errors,
    };

    reply.status(statusCode).send(errorResponse);
  }
}
