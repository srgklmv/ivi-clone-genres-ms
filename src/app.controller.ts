import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DeleteResult, UpdateResult } from 'typeorm';

import { AppService } from './app.service';
import { Genre } from './entity/genre.entity';
import { CreateGenreMessageDto } from './dto/genres/create-genre-message.dto';
import { GenreByIdMessageDto } from './dto/genres/genre-by-id-message.dto';
import { UpdateGenreMessageDto } from './dto/genres/update-genre-message.dto';
import { AddGenresToMovieDto } from './dto/add-genres-to-movie.dto';
import { GetMoviesByGenresDto } from './dto/get-movies-by-genres.dto';
import { Movie } from './entity/movie.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'createGenre' })
  async createGenre(
    createGenreMessageDto: CreateGenreMessageDto,
  ): Promise<Genre> {
    console.log('Genres MS - Controller - createGenre at', new Date());

    return this.appService.createGenre(createGenreMessageDto.createGenreDto);
  }

  @MessagePattern({ cmd: 'getAllGenres' })
  async getAllGenres(): Promise<Genre[]> {
    console.log('Genres MS - Controller - getAllGenres at', new Date());

    return this.appService.getAllGenres();
  }

  @MessagePattern({ cmd: 'getGenreById' })
  async getGenreById(
    getGenreByIdMessageDto: GenreByIdMessageDto,
  ): Promise<Genre> {
    console.log('Genres MS - Controller - getGenre at', new Date());

    return this.appService.getGenreById(getGenreByIdMessageDto.genreId);
  }

  @MessagePattern({ cmd: 'deleteGenre' })
  async deleteGenre(
    deleteGenreDto: GenreByIdMessageDto,
  ): Promise<DeleteResult> {
    console.log('Genres MS - Controller - deleteGenre at', new Date());

    return this.appService.deleteGenre(deleteGenreDto.genreId);
  }

  @MessagePattern({ cmd: 'updateGenre' })
  async updateGenre(
    updateGenreMessageDto: UpdateGenreMessageDto,
  ): Promise<UpdateResult> {
    console.log('Genres MS - Controller - updateGenre at', new Date());

    return this.appService.updateGenre(
      updateGenreMessageDto.genreId,
      updateGenreMessageDto.updateGenreDto,
    );
  }

  @MessagePattern({ cmd: 'addGenresToMovie' })
  async addGenresToMovie(
    addGenresToMovieDto: AddGenresToMovieDto,
  ): Promise<Movie> {
    console.log('Genres MS - Controller - getMovieGenres at', new Date());

    return this.appService.addGenresToMovie(addGenresToMovieDto);
  }

  @MessagePattern({ cmd: 'getMoviesByGenres' })
  async getMoviesByGenres(
    getMoviesByGenresDto: GetMoviesByGenresDto,
  ): Promise<number[]> {
    console.log('Genres MS - Controller - getMoviesByGenres at', new Date());

    return this.appService.getMoviesByGenres(getMoviesByGenresDto);
  }

  @MessagePattern({ cmd: 'deleteMovieFromGenres' })
  async deleteMovieFromGenres(deleteMovieFromGenresDto: {
    movieId: number;
  }): Promise<DeleteResult> {
    console.log(
      'Genres MS - Controller - deleteMovieFromGenres at',
      new Date(),
    );

    return this.appService.deleteMovieFromGenres(
      deleteMovieFromGenresDto.movieId,
    );
  }

  @MessagePattern({ cmd: 'getGenresByMoviesIds' })
  async getGenresByMoviesIds(getGenresByMoviesIdsDto: {
    movies: number[];
  }): Promise<[number, Genre[]][]> {
    console.log('Genres MS - Controller - getGenresByMoviesIds at', new Date());

    return this.appService.getGenresByMoviesIds(getGenresByMoviesIdsDto.movies);
  }

  @MessagePattern({ cmd: 'getHeaderStaticLinks' })
  async getHeaderStaticLinks(): Promise<object> {
    console.log('Genres MS - Controller - getHeaderStaticLinks at', new Date());

    return this.appService.getHeaderStaticLinks();
  }
}
