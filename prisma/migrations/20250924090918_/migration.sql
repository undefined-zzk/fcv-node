-- AddForeignKey
ALTER TABLE `FrameFuncLikeCollect` ADD CONSTRAINT `FrameFuncLikeCollect_frame_func_id_fkey` FOREIGN KEY (`frame_func_id`) REFERENCES `FrameFunc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
