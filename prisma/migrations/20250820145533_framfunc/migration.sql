/*
  Warnings:

  - Added the required column `classify_id` to the `FrameFunc` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `framefunc` ADD COLUMN `classify_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `FrameClassify` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FrameFuncLikeCollect` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `frame_func_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `type` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `FrameFunc_classify_id_name_idx` ON `FrameFunc`(`classify_id`, `name`);

-- AddForeignKey
ALTER TABLE `FrameFunc` ADD CONSTRAINT `FrameFunc_classify_id_fkey` FOREIGN KEY (`classify_id`) REFERENCES `FrameClassify`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
