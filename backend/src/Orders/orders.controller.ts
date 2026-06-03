import { User } from './../Users/entities/user.entity';
import { CurrentUser } from './../common/decorators/user.decorator';
import { IdempotencyInterceptor } from './../common/interceptors/idempotency.interceptor';
import {
  Body,
  Controller,
  Headers,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersCntroller {
  constructor(private readonly orderService: OrdersService) {}

  @UseInterceptors(IdempotencyInterceptor)
  @Post('/book')
  bookTicket(
    @Body() body: CreateOrderDto,
    @CurrentUser() user: User,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.orderService.createOrder(body, user, idempotencyKey);
  }
}
