-- AlterTable
ALTER TABLE "levels" ADD COLUMN     "defensive_review" JSONB;

-- CreateTable
CREATE TABLE "review_viewed" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_viewed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_viewed_user_id_level_id_key" ON "review_viewed"("user_id", "level_id");

-- AddForeignKey
ALTER TABLE "review_viewed" ADD CONSTRAINT "review_viewed_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_viewed" ADD CONSTRAINT "review_viewed_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
