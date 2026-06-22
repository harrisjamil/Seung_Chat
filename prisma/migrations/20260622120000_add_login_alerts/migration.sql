-- CreateEnum
CREATE TYPE "LoginAlertStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DENIED');

-- CreateTable
CREATE TABLE "login_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "LoginAlertStatus" NOT NULL DEFAULT 'PENDING',
    "ip" TEXT,
    "location" TEXT,
    "device_name" TEXT,
    "hardware_device_name" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_alerts_session_id_key" ON "login_alerts"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "login_alerts_token_key" ON "login_alerts"("token");

-- CreateIndex
CREATE INDEX "login_alerts_token_idx" ON "login_alerts"("token");

-- AddForeignKey
ALTER TABLE "login_alerts" ADD CONSTRAINT "login_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_alerts" ADD CONSTRAINT "login_alerts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
