/*
  Warnings:

  - You are about to drop the column `attention_id` on the `attentionfans` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `attentionfans` table. All the data in the column will be lost.
  - Added the required column `followed_id` to the `AttentionFans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `follower_id` to the `AttentionFans` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `attentionfans` DROP FOREIGN KEY `AttentionFans_user_id_fkey`;

-- DropIndex
DROP INDEX `AttentionFans_user_id_idx` ON `attentionfans`;

-- AlterTable
ALTER TABLE `attentionfans` DROP COLUMN `attention_id`,
    DROP COLUMN `user_id`,
    ADD COLUMN `followed_id` INTEGER NOT NULL,
    ADD COLUMN `follower_id` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `AttentionFans_followed_id_follower_id_idx` ON `AttentionFans`(`followed_id`, `follower_id`);

-- AddForeignKey
ALTER TABLE `AttentionFans` ADD CONSTRAINT `AttentionFans_follower_id_fkey` FOREIGN KEY (`follower_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttentionFans` ADD CONSTRAINT `AttentionFans_followed_id_fkey` FOREIGN KEY (`followed_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
