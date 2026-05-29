import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  MinLength,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  event_title: string;

  @IsOptional()
  @IsString()
  event_description?: string;

  @IsInt()
  @Min(1)
  total_tickets: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsDateString()
  starts_at: string;

  @IsDateString()
  ends_at: string;
}
