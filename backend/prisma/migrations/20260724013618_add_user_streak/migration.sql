-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_solved_at" TIMESTAMP(3),
ADD COLUMN     "longest_streak" INTEGER NOT NULL DEFAULT 0;
