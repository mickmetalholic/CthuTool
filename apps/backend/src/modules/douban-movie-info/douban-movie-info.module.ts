import { Module } from '@nestjs/common';
import { BrowserContentModule } from '../browser-content/browser-content.module';
import { DoubanMovieInfoController } from './douban-movie-info.controller';
import { DoubanMovieInfoService } from './douban-movie-info.service';

@Module({
  controllers: [DoubanMovieInfoController],
  imports: [BrowserContentModule],
  providers: [DoubanMovieInfoService],
})
export class DoubanMovieInfoModule {}
