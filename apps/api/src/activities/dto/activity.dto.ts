import { ACTIVITY_IMAGE_KEYS, PERIOD_UNITS } from "@lighthouse/shared";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Max, Min } from "class-validator";

// The longest title a card can show before it is cut off on a 1280px screen,
// with room to spare. A limit belongs here rather than only in the dialog: the
// dialog is one client of several.
const TITLE_MAX = 120;

// Repeating more than once a day is not what this app is for, and a period of
// several years is a typo. Both ends keep a slip from turning into a card that
// is permanently red or permanently green.
const EVERY_MIN = 1;
const EVERY_MAX = 365;

export class CreateActivityDto {
  // Supplied by the client, not the server: it is what makes a retried request
  // update the row it already made instead of adding a second one.
  @IsString()
  @Length(1, 64)
  id!: string;

  @IsString()
  @Length(1, TITLE_MAX)
  title!: string;

  @Type(() => Number)
  @IsInt()
  @Min(EVERY_MIN)
  @Max(EVERY_MAX)
  every!: number;

  @IsIn(PERIOD_UNITS)
  unit!: string;

  @IsOptional()
  @IsIn(ACTIVITY_IMAGE_KEYS)
  image?: string;

  // Absent means "starting now", which is what creating an activity in the
  // dialog has always meant.
  @IsOptional()
  @IsISO8601()
  lastDoneAt?: string;
}

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @Length(1, TITLE_MAX)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(EVERY_MIN)
  @Max(EVERY_MAX)
  every?: number;

  @IsOptional()
  @IsIn(PERIOD_UNITS)
  unit?: string;

  @IsOptional()
  @IsIn(ACTIVITY_IMAGE_KEYS)
  image?: string;
}

export class MarkDoneDto {
  // Absent means now. A client may send its own timestamp so that a press
  // recorded before the request went out is not filed under when it arrived.
  @IsOptional()
  @IsISO8601()
  doneAt?: string;
}
