import { Controller, Get, Param, Query } from '@nestjs/common';
// biome-ignore lint/style/useImportType: constructor injection token
import { DoubanMovieInfoService } from './douban-movie-info.service';

@Controller('api/douban')
export class DoubanMovieInfoController {
  constructor(private readonly movies: DoubanMovieInfoService) {}

  @Get('/movies')
  lookupMovie(@Query('input') input: string) {
    return this.movies.getMovie(input ?? '');
  }

  @Get('/movies/:subjectId')
  getMovie(@Param('subjectId') subjectId: string) {
    return this.movies.getMovie(subjectId);
  }
}
