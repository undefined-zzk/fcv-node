/*
  Warnings:

  - You are about to alter the column `balance` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `comment_status` INTEGER NOT NULL DEFAULT 0,
    MODIFY `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0;
