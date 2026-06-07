import type { EnrichArgs, EnrichResult } from "@neoworks-dev/otter-sdk";

const API_KEY = process.env.TMDB_API_KEY ?? "";
const LANGUAGE = process.env.TMDB_LANGUAGE ?? "de-DE";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", LANGUAGE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

interface TMDBMovie {
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  vote_average: number;
  credits?: {
    cast: { name: string; character: string; order: number }[];
    crew: { name: string; job: string }[];
  };
  images?: { backdrops: { file_path: string }[] };
}

interface TMDBSeries {
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  status: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  created_by: { name: string }[];
  credits?: {
    cast: { name: string; character: string; order: number }[];
    crew: { name: string; job: string }[];
  };
  images?: { backdrops: { file_path: string }[] };
}

interface SearchResult {
  results: { id: number; media_type?: string }[];
}

async function searchMovie(title: string, year?: number): Promise<number | null> {
  const params: Record<string, string> = { query: title };
  if (year) params.year = String(year);
  const data = await tmdb<{ results: { id: number }[] }>("/search/movie", params);
  return data.results[0]?.id ?? null;
}

async function searchSeries(title: string, year?: number): Promise<number | null> {
  const params: Record<string, string> = { query: title };
  if (year) params.first_air_date_year = String(year);
  const data = await tmdb<{ results: { id: number }[] }>("/search/tv", params);
  return data.results[0]?.id ?? null;
}

interface ExistingMedia {
  title: string;
  year?: number;
}

export async function enrich(args: EnrichArgs): Promise<EnrichResult> {
  if (!API_KEY) throw new Error("TMDB_API_KEY not set");

  const { mediaType, existing, missing } = args;
  const media = existing as ExistingMedia;
  const result: EnrichResult = {};
  // When missing is empty, fill everything we can.
  const want = (field: string) => missing.length === 0 || missing.includes(field);

  if (mediaType === "movie") {
    const id = await searchMovie(media.title, media.year);
    if (!id) return result;

    const movie = await tmdb<TMDBMovie>(`/movie/${id}`, {
      append_to_response: "credits,images",
    });

    if (want("description") && movie.overview)
      result.description = movie.overview;
    if (want("poster") && movie.poster_path)
      result.poster = `${IMG}${movie.poster_path}`;
    if (want("year") && movie.release_date)
      result.year = parseInt(movie.release_date.slice(0, 4), 10);
    if (want("durationMinutes") && movie.runtime)
      result.durationMinutes = movie.runtime;
    if (want("genres") && movie.genres.length)
      result.genres = movie.genres.map((g) => g.name);
    if (want("cast") && movie.credits?.cast)
      result.cast = movie.credits.cast.slice(0, 10).map((c) => ({
        name: c.name,
        role: "actor",
        character: c.character,
      }));
    if (want("images") && movie.images?.backdrops)
      result.images = movie.images.backdrops.slice(0, 5).map((b) => ({
        url: `${IMG}${b.file_path}`,
      }));
  } else if (mediaType === "series") {
    const id = await searchSeries(media.title, media.year);
    if (!id) return result;

    const series = await tmdb<TMDBSeries>(`/tv/${id}`, {
      append_to_response: "credits,images",
    });

    if (want("description") && series.overview)
      result.description = series.overview;
    if (want("poster") && series.poster_path)
      result.poster = `${IMG}${series.poster_path}`;
    if (want("year") && series.first_air_date)
      result.year = parseInt(series.first_air_date.slice(0, 4), 10);
    if (want("status"))
      result.status = series.status;
    if (want("genres") && series.genres.length)
      result.genres = series.genres.map((g) => g.name);
    if (want("cast") && series.credits?.cast)
      result.cast = series.credits.cast.slice(0, 10).map((c) => ({
        name: c.name,
        role: "actor",
        character: c.character,
      }));
    if (want("images") && series.images?.backdrops)
      result.images = series.images.backdrops.slice(0, 5).map((b) => ({
        url: `${IMG}${b.file_path}`,
      }));
  }

  return result;
}
