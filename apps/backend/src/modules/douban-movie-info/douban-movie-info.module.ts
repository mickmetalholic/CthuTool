import { Module } from '@nestjs/common';
import { BrowserModule } from '../browser/browser.module';
import { DoubanMovieInfoController } from './douban-movie-info.controller';
import { DoubanMovieInfoService } from './douban-movie-info.service';

@Module({
  controllers: [DoubanMovieInfoController],
  imports: [BrowserModule],
  providers: [DoubanMovieInfoService],
})
export class DoubanMovieInfoModule {}
