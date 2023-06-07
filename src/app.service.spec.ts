import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

import { Genre } from './entity/genre.entity';
import { Movie } from './entity/movie.entity';
import { AddGenresToMovieDto } from './dto/add-genres-to-movie.dto';
import { AppService } from './app.service';

describe('AppService', () => {
  let appModule: TestingModule;
  let appService: AppService;
  let movieRepository: Repository<Movie>;
  let genreRepository: Repository<Genre>;

  beforeAll(async () => {
    appModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'genres',
          entities: [Genre, Movie],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Genre, Movie]),
      ],
      providers: [AppService, Movie, Genre],
    }).compile();

    appService = appModule.get<AppService>(AppService);
    genreRepository = await appService.getGenreRepository();
    movieRepository = await appService.getMovieRepository();
  });

  afterAll(async () => {
    await appModule.close();
  });

  it('App service defined.', () => {
    expect(appService).toBeDefined();
  });

  it('Movie repository defined.', () => {
    expect(movieRepository).toBeDefined();
  });

  it('Genre repository defined.', () => {
    expect(genreRepository).toBeDefined();
  });

  describe('Create genre.', () => {
    let newGenre: Genre;

    it('Create genre with valid data.', async () => {
      newGenre = await appService.createGenre({
        nameEn: 'New genre',
        nameRu: 'Новый жанр',
      });
      console.log(newGenre);
      expect(newGenre).toBeDefined();
      expect(newGenre).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          nameRu: expect.any(String),
          nameEn: expect.any(String),
        }),
      );
      expect(newGenre.nameEn).toEqual('New genre');
      expect(newGenre.nameRu).toEqual('Новый жанр');
    });

    it('Create genre with existing nameRu.', async () => {
      try {
        await appService.createGenre({
          nameEn: 'New new genre',
          nameRu: 'Новый жанр',
        });
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.message).toEqual('Genre with given names already exists!');
      }
    });

    it('Create genre with existing nameEn.', async () => {
      try {
        await appService.createGenre({
          nameEn: 'New genre',
          nameRu: 'Новый новый жанр',
        });
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.message).toEqual('Genre with given names already exists!');
      }
    });

    afterAll(async () => {
      await appService.deleteGenre(newGenre.id);
    });
  });

  describe('Get all genres.', () => {
    const newGenres: Genre[] = [];
    let genresBeforeTests: Genre[];

    beforeAll(async () => {
      genresBeforeTests = await appService.getAllGenres();

      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 1',
          nameRu: 'Новый жанр 1',
        }),
      );
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 2',
          nameRu: 'Новый жанр 2',
        }),
      );
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 3',
          nameRu: 'Новый жанр 3',
        }),
      );
    });

    it('Getting proper list of genres', async () => {
      const genres = await appService.getAllGenres();

      console.log(genres.length, genresBeforeTests.length, newGenres.length);
      expect(
        genres.length - genresBeforeTests.length == newGenres.length,
      ).toEqual(true);
      expect(genres).toEqual(expect.arrayContaining(newGenres));
    });

    afterAll(async () => {
      for (const newGenre of newGenres) {
        await appService.deleteGenre(newGenre.id);
      }
    });
  });

  describe('Get genre by ID.', () => {
    let genre: Genre;
    let receivedGenre: Genre;

    beforeAll(async () => {
      genre = await appService.createGenre({
        nameEn: 'New genre',
        nameRu: 'Новый жанр',
      });
    });

    it('Get existing genre by its ID.', async () => {
      receivedGenre = await appService.getGenreById(genre.id);

      expect(receivedGenre).toEqual(genre);

      await appService.deleteGenre(receivedGenre.id);
    });

    it('Get deleted genre by its ID.', async () => {
      try {
        receivedGenre = await appService.getGenreById(genre.id);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.message).toEqual('Genre not found!');
      }
    });
  });

  describe('Delete genre.', () => {
    let newGenre: Genre;
    let genresBefore: Genre[];

    beforeAll(async () => {
      genresBefore = await appService.getAllGenres();

      newGenre = await appService.createGenre({
        nameEn: 'New genre',
        nameRu: 'Новый жанр',
      });
    });

    it('Delete existing genre.', async () => {
      const deleteResult = await appService.deleteGenre(newGenre.id);
      const allGenres = await appService.getAllGenres();

      expect(deleteResult).toBeInstanceOf(DeleteResult);
      expect(deleteResult.affected).toEqual(1);
      expect(allGenres).toEqual(genresBefore);
    });

    it('Delete not existing genre.', async () => {
      try {
        await appService.deleteGenre(newGenre.id);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.message).toEqual('Genre not found!');
      }
      const allGenres = await appService.getAllGenres();

      expect(allGenres).toEqual(genresBefore);
    });
  });

  describe('Update genre.', () => {
    let genre: Genre;
    let updatedGenre: Genre;

    beforeAll(async () => {
      genre = await appService.createGenre({
        nameEn: 'New genre',
        nameRu: 'Новый жанр',
      });
    });

    it('Update existing genre.', async () => {
      const response = await appService.updateGenre(genre.id, {
        nameEn: 'Updated genre',
        nameRu: 'Обновлённый жанр',
      });
      updatedGenre = await appService.getGenreById(genre.id);

      expect(response).toBeInstanceOf(UpdateResult);
      expect(updatedGenre.nameEn).toEqual('Updated genre');
      expect(updatedGenre.nameRu).toEqual('Обновлённый жанр');

      await appService.deleteGenre(genre.id);
    });

    it('Update not existing genre.', async () => {
      try {
        await appService.updateGenre(genre.id, {
          nameEn: 'Updated genre',
          nameRu: 'Обновлённый жанр',
        });
        expect(true).toEqual(false);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.message).toEqual('Genre not found!');
      }
    });
  });

  describe('Add genres to movie.', () => {
    let newMovie: Movie;
    let newGenresIds: number[];

    const newGenres: Genre[] = [];
    const createdMovieId = 1234;

    beforeAll(async () => {
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 1',
          nameRu: 'Новый жанр 1',
        }),
      );
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 2',
          nameRu: 'Новый жанр 2',
        }),
      );
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 3',
          nameRu: 'Новый жанр 3',
        }),
      );

      newGenresIds = newGenres.map((genre) => genre.id);

      await appService.deleteMovieFromGenres(createdMovieId);
    });

    it('Add genres to not existing movie.', async () => {
      const addGenresToMovieDto: AddGenresToMovieDto = {
        movieId: createdMovieId,
        genres: newGenresIds,
      };

      newMovie = await appService.addGenresToMovie(addGenresToMovieDto);

      expect(newMovie.movieId).toEqual(createdMovieId);
      expect(newMovie.genres).toEqual(expect.arrayContaining(newGenres));
    });

    it('Change genres in existing movie.', async () => {
      const addGenresToMovieDto: AddGenresToMovieDto = {
        movieId: createdMovieId,
        genres: [newGenresIds[1]],
      };

      newMovie = await appService.addGenresToMovie(addGenresToMovieDto);

      expect(newMovie.movieId).toEqual(createdMovieId);
      expect(newMovie.genres).toEqual([newGenres[1]]);
    });

    it('Delete movie.', async () => {
      const result = await appService.deleteMovieFromGenres(createdMovieId);
      const deletedMovie = await movieRepository.findOneBy({
        movieId: createdMovieId,
      });

      expect(result).toBeInstanceOf(DeleteResult);
      expect(result.affected).toEqual(1);
      expect(deletedMovie).toBeNull();
    });

    afterAll(async () => {
      for (const genre of newGenres) {
        await appService.deleteGenre(genre.id);
      }
    });
  });

  describe('Get movies by genres', () => {
    const newGenres: Genre[] = [];
    const newMovies: Movie[] = [];

    beforeAll(async () => {
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 1',
          nameRu: 'Новый жанр 1',
        }),
      );
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 2',
          nameRu: 'Новый жанр 2',
        }),
      );
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 3',
          nameRu: 'Новый жанр 3',
        }),
      );

      newMovies.push(
        await appService.addGenresToMovie({
          movieId: 1,
          genres: [newGenres[0].id, newGenres[1].id],
        }),
      );
      newMovies.push(
        await appService.addGenresToMovie({
          movieId: 2,
          genres: [newGenres[1].id],
        }),
      );
      newMovies.push(
        await appService.addGenresToMovie({
          movieId: 3,
          genres: [newGenres[1].id, newGenres[2].id],
        }),
      );
    });

    it('Find by one existing genre.', async () => {
      const firstRequest = await appService.getMoviesByGenres({
        genres: ['new genre 3'],
      });
      const secondRequest = await appService.getMoviesByGenres({
        genres: ['new genre 2'],
      });

      expect(firstRequest).toEqual(expect.arrayContaining([3]));
      expect(secondRequest).toEqual(expect.arrayContaining([1, 2]));
    });

    it('Find by few existing genres.', async () => {
      const firstRequest = await appService.getMoviesByGenres({
        genres: ['new genre 3', 'new genre 2'],
      });
      const secondRequest = await appService.getMoviesByGenres({
        genres: ['new genre 3', 'new genre 2', 'new genre 1'],
      });

      expect(firstRequest).toEqual(expect.arrayContaining([1, 2, 3]));
      expect(secondRequest).toEqual(expect.arrayContaining([1, 2, 3]));
    });

    it('Find by non-existing and existing genres.', async () => {
      const firstRequest = await appService.getMoviesByGenres({
        genres: ['new genre 4', 'new genre 1'],
      });

      expect(firstRequest).toEqual(expect.arrayContaining([1]));
    });

    it('Find by non-existing genres.', async () => {
      const firstRequest = await appService.getMoviesByGenres({
        genres: ['new genre 77', 'new genre 222'],
      });
      const secondRequest = await appService.getMoviesByGenres({
        genres: ['new genre 33', 'new genre 211', 'new genre 12'],
      });

      expect(firstRequest).toEqual([]);
      expect(secondRequest).toEqual([]);
    });

    afterAll(async () => {
      for (const genre of newGenres) {
        await appService.deleteGenre(genre.id);
      }
      for (const movie of newMovies) {
        await appService.deleteMovieFromGenres(movie.movieId);
      }
    });
  });

  describe('Get genres by movies IDs (extend movie objects with genre objects)', () => {
    const newGenres: Genre[] = [];
    const newMovies: Movie[] = [];

    beforeAll(async () => {
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 1',
          nameRu: 'Новый жанр 1',
        }),
      );
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 2',
          nameRu: 'Новый жанр 2',
        }),
      );
      newGenres.push(
        await appService.createGenre({
          nameEn: 'New genre 3',
          nameRu: 'Новый жанр 3',
        }),
      );

      newMovies.push(
        await appService.addGenresToMovie({
          movieId: 1,
          genres: [newGenres[0].id, newGenres[1].id],
        }),
      );
      newMovies.push(
        await appService.addGenresToMovie({
          movieId: 2,
          genres: [newGenres[1].id],
        }),
      );
      newMovies.push(
        await appService.addGenresToMovie({
          movieId: 3,
          genres: [newGenres[1].id, newGenres[2].id],
        }),
      );

      await appService.deleteMovieFromGenres(4);
      await appService.deleteMovieFromGenres(5);
    });

    it('Add genres to existing movies.', async () => {
      const response = await appService.getGenresByMoviesIds([1, 2, 3]);

      expect(response[0][1]).toEqual(
        expect.arrayContaining([newGenres[0], newGenres[1]]),
      );
      expect(response[1][1]).toEqual(expect.arrayContaining([newGenres[1]]));
      expect(response[2][1]).toEqual(
        expect.arrayContaining([newGenres[1], newGenres[2]]),
      );
    });

    it('Add genres to non-existing movies.', async () => {
      const response = await appService.getGenresByMoviesIds([4, 5]);

      expect(response[0][1]).toEqual([]);
      expect(response[1][1]).toEqual([]);
    });

    afterAll(async () => {
      for (const genre of newGenres) {
        await appService.deleteGenre(genre.id);
      }
      for (const movie of newMovies) {
        await appService.deleteMovieFromGenres(movie.movieId);
      }
    });
  });

  describe('Get static header links.', () => {
    it('Get links with genres.', async () => {
      const links: any = await appService.getHeaderStaticLinks();

      expect(links).toHaveProperty('movies_categories');
      expect(links).toHaveProperty('series_categories');
      expect(links).toHaveProperty('animation_categories');
      expect(links.movies_categories).toHaveProperty('genre');
      expect(links.movies_categories.genre.length).toEqual(22);
      expect(links.movies_categories.genre[0]).toHaveProperty('link');
    });
  });
});
