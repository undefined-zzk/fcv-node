-- CreateTable
CREATE TABLE `FrameArticleCommentLike` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` INTEGER NOT NULL,
    `article_id` INTEGER NULL,
    `func_id` INTEGER NULL,
    `comment_id` INTEGER NOT NULL,
    `comment_pid` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
