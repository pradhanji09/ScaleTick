import { HttpException } from '@nestjs/common';
import { RestErrorShape } from './rest-error.type';

export class RestError extends HttpException {
  public readonly title: string;
  public readonly code: string;

  constructor(shape: RestErrorShape) {
    super(shape.message, shape.httpCode);
    this.title = shape.title;
    this.code = shape.code;
  }
}

export class RestErrorProvider {
  static create(shape: RestErrorShape): RestError {
    return new RestError(shape);
  }
}
