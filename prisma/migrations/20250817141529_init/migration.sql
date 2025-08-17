-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(11) NOT NULL,
    `password` TEXT NOT NULL,
    `member` INTEGER NOT NULL DEFAULT 0,
    `nickname` VARCHAR(10) NULL,
    `role` JSON NOT NULL,
    `attention` INTEGER NULL DEFAULT 0,
    `fans` INTEGER NULL DEFAULT 0,
    `integral` INTEGER NULL DEFAULT 0,
    `praise` INTEGER NULL DEFAULT 0,
    `rank` INTEGER NULL DEFAULT 0,
    `city` VARCHAR(20) NULL,
    `birthday` VARCHAR(10) NULL,
    `company` VARCHAR(30) NULL,
    `graduate_year` INTEGER NULL DEFAULT 1960,
    `education` VARCHAR(191) NULL,
    `major` VARCHAR(191) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `github` VARCHAR(100) NULL,
    `update_time` DATETIME(3) NULL,
    `last_login_time` DATETIME(3) NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `intro` VARCHAR(50) NULL,
    `motto` VARCHAR(50) NULL,
    `avatar` VARCHAR(191) NOT NULL DEFAULT '/static/image/default.webp',
    `ip` VARCHAR(191) NULL,
    `post` VARCHAR(191) NULL,
    `gender` INTEGER NOT NULL DEFAULT 0,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `comment_status` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `User_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `login_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hostname` VARCHAR(50) NULL,
    `user_agent` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NULL,
    `result` VARCHAR(191) NOT NULL,
    `fail_reason` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LoginLog` ADD CONSTRAINT `LoginLog_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
