-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL,
    "every" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "last_done_at" TIMESTAMP(3) NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completions" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "done_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_picks" (
    "household_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "hero_id" TEXT,
    "rows" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "day_picks_pkey" PRIMARY KEY ("household_id","day")
);

-- CreateIndex
CREATE INDEX "activities_household_id_updated_at_idx" ON "activities"("household_id", "updated_at");

-- CreateIndex
CREATE INDEX "activities_household_id_deleted_at_idx" ON "activities"("household_id", "deleted_at");

-- CreateIndex
CREATE INDEX "completions_activity_id_done_at_idx" ON "completions"("activity_id", "done_at");

-- AddForeignKey
ALTER TABLE "completions" ADD CONSTRAINT "completions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

