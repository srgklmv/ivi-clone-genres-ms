import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { CreateGenreMessageDto } from './dto/create-genre-message.dto';
import { GenreByIdMessageDto } from './dto/genre-by-id-message.dto';
import { UpdateGenreMessageDto } from './dto/update-genre-message.dto';
import { AddGenresToMovieDto } from './dto/add-genres-to-movie.dto';
import { Movie } from './entity/movie.entity';
import { GetMoviesByGenresDto } from './dto/get-movies-by-genres.dto';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Genre) private genreRepository: Repository<Genre>,
    @InjectRepository(Movie) private movieRepository: Repository<Movie>,
  ) {}

  async createGenre(
    createGenreMessageDto: CreateGenreMessageDto,
  ): Promise<Genre> {
    console.log('Genres MS - Service - createGenre at', new Date());
    return this.genreRepository.save(createGenreMessageDto.createGenreDto);
  }

  async getAllGenres(): Promise<Genre[]> {
    console.log('Genres MS - Service - getAllGenres at', new Date());
    return this.genreRepository.find();
  }

  async getGenreById(
    getGenreByIdMessageDto: GenreByIdMessageDto,
  ): Promise<Genre> {
    console.log('Genres MS - Service - getGenre at', new Date());
    return this.genreRepository.findOneBy({
      id: getGenreByIdMessageDto.genreId,
    });
  }

  async deleteGenre(
    getGenreByIdMessageDto: GenreByIdMessageDto,
  ): Promise<DeleteResult> {
    console.log('Genres MS - Service - deleteGenre at', new Date());
    return this.genreRepository.delete(getGenreByIdMessageDto.genreId);
  }

  async updateGenre(
    updateGenreMessageDto: UpdateGenreMessageDto,
  ): Promise<UpdateResult> {
    console.log('Genres MS - Service - updateGenre at', new Date());
    return this.genreRepository.update(updateGenreMessageDto.genreId, {
      nameRu: updateGenreMessageDto.updateGenreDto.nameRu,
      nameEn: updateGenreMessageDto.updateGenreDto.nameEn,
    });
  }

  async addGenresToMovie(addGenresToMovieDto: AddGenresToMovieDto) {
    console.log('Genres MS - Service - addGenresToMovie at', new Date());

    //Create movie if not exists
    if (
      !(await this.movieRepository.findOneBy({
        movieId: addGenresToMovieDto.movieId,
      }))
    ) {
      await this.movieRepository.save({ movieId: addGenresToMovieDto.movieId });
    }

    //Get movie
    const movie = await this.movieRepository.findOneBy({
      movieId: addGenresToMovieDto.movieId,
    });

    //Adding genres to movie
    movie.genres = [];
    for (const genreId of addGenresToMovieDto.genres) {
      const genre = await this.genreRepository.findOneBy({
        id: genreId,
      });
      movie.genres.push(genre);
    }

    return await this.movieRepository.save(movie);
  }

  async getMoviesByGenres(getMoviesByGenresDto: GetMoviesByGenresDto) {
    console.log('Genres MS - Service - getMoviesByGenresDto at', new Date());
    const genresCounter = { value: 0 };
    const allDuplicatedMoviesIds = [];
    for (const genreNameEn of getMoviesByGenresDto.genres) {
      const capitalizedNameEn =
        genreNameEn.charAt(0).toUpperCase() + genreNameEn.slice(1);
      const moviesByGenre = await this.movieRepository.find({
        relations: {
          genres: true,
        },
        where: {
          genres: {
            nameEn: capitalizedNameEn,
          },
        },
      });
      const moviesByGenreIds = moviesByGenre.map((movie) => movie.movieId);

      genresCounter.value++;
      allDuplicatedMoviesIds.push(...moviesByGenreIds);
    }

    const countedIdsIncomes = {};
    for (const id of allDuplicatedMoviesIds) {
      countedIdsIncomes[id] =
        countedIdsIncomes[id] >= 1
          ? (countedIdsIncomes[id] = countedIdsIncomes[id] + 1)
          : 1;
    }

    const moviesWithAllGenresIds = [];

    for (const counter of Object.keys(countedIdsIncomes)) {
      if (countedIdsIncomes[counter] == genresCounter.value) {
        moviesWithAllGenresIds.push(counter);
      }
    }

    return moviesWithAllGenresIds;
  }

  async deleteMovieFromGenres(movieId: number) {
    console.log('Genres MS - Service - deleteMovieFromGenres at', new Date());
    return this.movieRepository.delete({ movieId: movieId });
  }

  async getGenresByMoviesIds(movies: number[]) {
    console.log('Genres MS - Service - getGenresByMoviesIds at', new Date());
    const moviesWithGenresArrays = [];
    for (const movieId of movies) {
      moviesWithGenresArrays.push(await this.movieGenresToArray(movieId));
    }
    return moviesWithGenresArrays;
  }

  private async movieGenresToArray(movieId: number) {
    console.log(
      'Genres MS - Service - PRIVATE movieGenresToArray at',
      new Date(),
    );
    const movie = await this.movieRepository.findOne({
      where: {
        movieId: movieId,
      },
      relations: {
        genres: true,
      },
    });

    if (movie==null) return [movieId, []]

    return [movie.movieId, movie.genres];
  }
}
