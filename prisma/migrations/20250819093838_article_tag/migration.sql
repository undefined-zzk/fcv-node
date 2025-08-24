/*
  Warnings:

  - You are about to drop the column `tag_id` on the `article` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `article` DROP FOREIGN KEY `Article_tag_id_fkey`;

-- DropIndex
DROP INDEX `Article_tag_id_fkey` ON `article`;

-- AlterTable
ALTER TABLE `article` DROP COLUMN `tag_id`;

-- CreateTable
CREATE TABLE `_tag_article` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_tag_article_AB_unique`(`A`, `B`),
    INDEX `_tag_article_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_tag_article` ADD CONSTRAINT `_tag_article_A_fkey` FOREIGN KEY (`A`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_tag_article` ADD CONSTRAINT `_tag_article_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
