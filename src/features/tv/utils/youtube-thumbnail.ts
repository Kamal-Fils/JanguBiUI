import type { TvVideo } from '../types';

/**
 * Extrait l'ID YouTube d'une URL (watch?v=, youtu.be, /embed/, /live/, /shorts/)
 * pour servir une vignette éditoriale sans démarrer le lecteur.
 */
export function youtubeThumbnail(video: TvVideo): string | null {
  const source = `${video.youtube_url} ${video.embed_url}`;
  const match =
    source.match(/[?&]v=([\w-]{11})/) ??
    source.match(/youtu\.be\/([\w-]{11})/) ??
    source.match(/\/(?:embed|live|shorts)\/([\w-]{11})/);
  const id = match?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
