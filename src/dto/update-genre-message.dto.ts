import { GenreByIdMessageDto } from './genre-by-id-message.dto';
import { CreateGenreDto } from './create-genre.dto';

export class UpdateGenreMessageDto extends GenreByIdMessageDto {
  updateGenreDto: CreateGenreDto;
  genreId: number;
}
