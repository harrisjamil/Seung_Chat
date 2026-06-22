/*
  Warnings:

  - You are about to drop the column `cnic` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_cnic_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "cnic";
