import { runPlugin } from "@shutterly/sdk";
import { enrich } from "./src/enrich.ts";

runPlugin({
  meta: {
    name: "tmdb",
    displayName: "TMDB",
    description: "The Movie Database — enrich media with cast, poster, and metadata",
    icon: "https://www.themoviedb.org/favicon.ico",
    version: "0.1.0",
    capabilities: ["enrich"],
    settings: [
      {
        key: "TMDB_API_KEY",
        label: "API Key",
        description: "API key from themoviedb.org",
        type: "password",
        required: true,
      },
      {
        key: "TMDB_LANGUAGE",
        label: "Language",
        description: "Preferred metadata language (BCP 47, e.g. de-DE)",
        type: "string",
        default: "de-DE",
      },
    ],
  },
  enrich: (args) => enrich(args),
});
