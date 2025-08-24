/*
  Warnings:

  - Added the required column `cover` to the `FrameClassify` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `FrameClassify` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `frameclassify` ADD COLUMN `cover` VARCHAR(191) NOT NULL,
    ADD COLUMN `path` VARCHAR(191) NOT NULL,
    ADD COLUMN `sort` INTEGER NOT NULL DEFAULT 0;
