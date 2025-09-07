-- AlterTable
ALTER TABLE `articlecomment` ADD COLUMN `likes` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `framecomment` ADD COLUMN `update_time` DATETIME(3) NULL;
