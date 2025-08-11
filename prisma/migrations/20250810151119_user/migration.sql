-- AlterTable
ALTER TABLE `user` ADD COLUMN `balance` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `last_login_time` DATETIME(3) NULL,
    ADD COLUMN `update_time` DATETIME(3) NULL;
