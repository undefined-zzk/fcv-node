/*
  Warnings:

  - You are about to drop the column `tag_id` on the `framefunc` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `framefunc` DROP FOREIGN KEY `FrameFunc_tag_id_fkey`;

-- DropIndex
DROP INDEX `FrameFunc_tag_id_fkey` ON `framefunc`;

-- AlterTable
ALTER TABLE `framefunc` DROP COLUMN `tag_id`;

-- CreateTable
CREATE TABLE `_tag_framefunc` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_tag_framefunc_AB_unique`(`A`, `B`),
    INDEX `_tag_framefunc_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_tag_framefunc` ADD CONSTRAINT `_tag_framefunc_A_fkey` FOREIGN KEY (`A`) REFERENCES `FrameFunc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_tag_framefunc` ADD CONSTRAINT `_tag_framefunc_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
