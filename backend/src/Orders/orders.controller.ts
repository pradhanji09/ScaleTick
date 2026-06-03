import { User } from './../Users/entities/user.entity';
import { CurrentUser } from './../common/decorators/user.decorator';
import { IdempotencyInterceptor } from './../common/interceptors/idempotency.interceptor';
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { GetOrdersDto } from './dto/get-orders.dto';

@Controller('orders')
export class OrdersCntroller {
  constructor(private readonly orderService: OrdersService) {}

  @Get('/my-orders')
  getMyOrders(@CurrentUser() user: User, @Query() query: GetOrdersDto) {
    return this.orderService.getMyOrderList(user, query);
  }

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
