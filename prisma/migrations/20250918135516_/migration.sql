/*
  Warnings:

  - Added the required column `update_time` to the `AppealRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `appealrecord` ADD COLUMN `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `update_time` DATETIME(3) NOT NULL;
