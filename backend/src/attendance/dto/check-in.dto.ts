import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CheckInDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  gpsLat: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  gpsLong: number;
}
