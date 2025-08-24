-- AlterTable
ALTER TABLE `appeal` MODIFY `update_time` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `article` MODIFY `update_time` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `articlecomment` MODIFY `update_time` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `attentionfans` MODIFY `update_time` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `framefunc` MODIFY `update_time` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `specialcolumn` MODIFY `update_time` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `tag` MODIFY `update_time` DATETIME(3) NULL;
