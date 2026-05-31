import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
