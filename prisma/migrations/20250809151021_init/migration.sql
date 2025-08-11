-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(11) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `member` INTEGER NOT NULL DEFAULT 0,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` INTEGER NOT NULL DEFAULT 0,
    `intro` VARCHAR(50) NULL,
    `motto` VARCHAR(50) NULL,
    `avatar` VARCHAR(191) NOT NULL DEFAULT '/static/image/default.webp',
    `ip` VARCHAR(191) NOT NULL,
    `post` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `user_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
