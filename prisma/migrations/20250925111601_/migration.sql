/*
  Warnings:

  - Made the column `update_time` on table `specialcolumn` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `specialcolumn` MODIFY `update_time` DATETIME(3) NOT NULL;
