import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, In, Repository, UpdateResult } from 'typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Genre } from './entity/genre.entity';
import { AddGenresToMovieDto } from './dto/add-genres-to-movie.dto';
import { Movie } from './entity/movie.entity';
import { GetMoviesByGenresDto } from './dto/get-movies-by-genres.dto';
import { HeaderStaticLinks } from './static/header-static-links';
import { CreateGenreDto } from './dto/genres/create-genre.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Genre) private genreRepository: Repository<Genre>,
    @InjectRepository(Movie) private movieRepository: Repository<Movie>,
  ) {}

  async createGenre(createGenreDto: CreateGenreDto): Promise<Genre> {
    console.log('Genres MS - Service - createGenre at', new Date());

    const similarGenres: Genre[] = await this.genreRepository.find({
      where: [
        { nameEn: createGenreDto.nameEn },
        { nameRu: createGenreDto.nameRu },
      ],
    });

    if (similarGenres.length > 0) {
      throw new RpcException(
        new BadRequestException('Genre with given names already exists!'),
      );
    }

    return this.genreRepository.save(createGenreDto);
  }

  async getAllGenres(): Promise<Genre[]> {
    console.log('Genres MS - Service - getAllGenres at', new Date());

    const genres: Genre[] = await this.genreRepository.find();

    if (genres.length == 0) {
      throw new RpcException(new NotFoundException('No genres were found!'));
    }

    return genres;
  }

  async getGenreById(genreId: number): Promise<Genre> {
    console.log('Genres MS - Service - getGenre at', new Date());

    const genre: Genre = await this.genreRepository.findOneBy({
      id: genreId,
    });

    if (!genre) {
      throw new RpcException(new NotFoundException('Genre not found!'));
    }

    return genre;
  }

  async deleteGenre(genreId: number): Promise<DeleteResult> {
    console.log('Genres MS - Service - deleteGenre at', new Date());

    const genre: Genre = await this.getGenreById(genreId);

    return this.genreRepository.delete(genre);
  }

  async updateGenre(
    genreId: number,
    updateGenreDto: CreateGenreDto,
  ): Promise<UpdateResult> {
    console.log('Genres MS - Service - updateGenre at', new Date());

    const genre: Genre = await this.getGenreById(genreId);

    return this.genreRepository.update(genre, {
      nameRu: updateGenreDto.nameRu,
      nameEn: updateGenreDto.nameEn,
    });
  }

  async addGenresToMovie(
    addGenresToMovieDto: AddGenresToMovieDto,
  ): Promise<Movie> {
    console.log('Genres MS - Service - addGenresToMovie at', new Date());

    //Create movie if not exists
    const movie: Movie = await this.movieRepository.save({
      movieId: addGenresToMovieDto.movieId,
    });

    //Adding genres to movie
    movie.genres = await this.genreRepository.find({
      where: {
        id: In(addGenresToMovieDto.genres),
      },
    });

    return await this.movieRepository.save(movie);
  }

  async getMoviesByGenres(
    getMoviesByGenresDto: GetMoviesByGenresDto,
  ): Promise<number[]> {
    console.log('Genres MS - Service - getMoviesByGenresDto at', new Date());

    getMoviesByGenresDto.genres = getMoviesByGenresDto.genres.map(
      (genreName: string) => genreName.at(0).toUpperCase() + genreName.slice(1),
    );

    const movies: Movie[] = await this.movieRepository.find({
      where: {
        genres: {
          nameEn: In(getMoviesByGenresDto.genres),
        },
      },
    });

    return movies.map((movie: Movie) => movie.movieId);
  }

  async deleteMovieFromGenres(movieId: number): Promise<DeleteResult> {
    console.log('Genres MS - Service - deleteMovieFromGenres at', new Date());

    return this.movieRepository.delete({ movieId: movieId });
  }

  async getGenresByMoviesIds(movies: number[]): Promise<[number, Genre[]][]> {
    console.log('Genres MS - Service - getGenresByMoviesIds at', new Date());

    const moviesWithGenresArrays: [number, Genre[]][] = [];

    for (const movieId of movies) {
      moviesWithGenresArrays.push(await this.movieGenresToArray(movieId));
    }

    return moviesWithGenresArrays;
  }

  async getHeaderStaticLinks(): Promise<object> {
    console.log('Genres MS - Service - getHeaderStaticLinks at', new Date());

    const headerStaticLinks = HeaderStaticLinks;

    if (headerStaticLinks.movies_categories.genre.length > 0) {
      headerStaticLinks.movies_categories.genre = [];
    }

    const genres: Genre[] = await this.genreRepository.find({ take: 22 });
    for (const genre of genres) {
      const genreNameKebabCased = genre.nameEn
        .toLowerCase()
        .split(' ')
        .join('-');

      headerStaticLinks.movies_categories.genre.push({
        ...genre,
        link: `/movies/${genreNameKebabCased}`,
      });
    }

    return headerStaticLinks;
  }

  private async movieGenresToArray(
    movieId: number,
  ): Promise<[number, Genre[]]> {
    console.log(
      'Genres MS - Service - PRIVATE movieGenresToArray at',
      new Date(),
    );

    const movie: Movie = await this.movieRepository.findOne({
      where: {
        movieId: movieId,
      },
      relations: {
        genres: true,
      },
    });

    if (movie == null) return [movieId, []];

    return [movie.movieId, movie.genres];
  }
}
