# otter-plugin-tmdb

Otter plugin for [The Movie Database](https://www.themoviedb.org). Enriches movies and series with cast, poster, description, genres, runtime, and backdrop images. Requires a TMDB API key.

---

## Overview

TMDB is the primary enrichment source for mainstream movies and series. This plugin searches TMDB by title (and optional year), fetches full metadata including credits and backdrop images, and returns only the fields that are missing from the existing record.

## Capabilities

| Capability | Description |
|------------|-------------|
| `enrich` | Fills missing fields (cast, poster, description, genres, year, runtime, images) for movies and series |

## Enriched fields

| Field | Movies | Series |
|-------|:------:|:------:|
| `description` | ✓ | ✓ |
| `poster` | ✓ | ✓ |
| `year` | ✓ | ✓ |
| `genres` | ✓ | ✓ |
| `cast` (top 10) | ✓ | ✓ |
| `images` (up to 5 backdrops) | ✓ | ✓ |
| `duration_minutes` | ✓ | — |
| `status` | — | ✓ |

## Configuration

| Setting | Required | Description |
|---------|:--------:|-------------|
| `TMDB_API_KEY` | Yes | API key from [themoviedb.org](https://www.themoviedb.org/settings/api) |
| `TMDB_LANGUAGE` | No | Metadata language as BCP 47 tag (default: `de-DE`) |

Settings are passed as environment variables when Otter invokes the plugin.

## Development

```sh
bun install
TMDB_API_KEY=your_key bun run index.ts
```

```json
{
  "capability": "enrich",
  "args": {
    "media_type": "movie",
    "existing": { "title": "Inception", "year": 2010 },
    "missing": ["description", "cast", "poster"]
  }
}
```

Output:

```json
{
  "result": {
    "description": "Cobb, a skilled thief...",
    "poster": "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    "cast": [{ "name": "Leonardo DiCaprio", "role": "actor", "character": "Cobb" }]
  }
}
```

## License

MIT
