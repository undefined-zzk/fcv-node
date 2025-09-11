-- AlterTable
ALTER TABLE `framearticlecommentlike` ADD COLUMN `article_pid` INTEGER NULL,
    MODIFY `comment_id` INTEGER NULL,
    MODIFY `comment_pid` INTEGER NULL;
