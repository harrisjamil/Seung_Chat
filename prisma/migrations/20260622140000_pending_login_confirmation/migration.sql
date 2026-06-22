-- AlterTable
ALTER TABLE "login_alerts" ALTER COLUMN "session_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "login_alerts" ADD COLUMN "remember_me" BOOLEAN NOT NULL DEFAULT true;
