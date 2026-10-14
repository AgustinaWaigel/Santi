import Reveal from "@/components/Reveal";
import { spotifyEmbed } from "@/data/products";

// Reproductor de la playlist cargada en el admin; no muestra nada si no hay enlace. `compact` usa la versión baja.
export default function SpotifyPlayer({ url, compact = false }: { url: string; compact?: boolean }) {
  const embed = spotifyEmbed(url);
  if (!embed) return null;
  return (
    <section className="home-section">
      <Reveal className="section-heading"><h2>Suena en Blackfit</h2><a href={url} target="_blank" rel="noopener noreferrer">Abrir en Spotify <span aria-hidden="true">→</span></a></Reveal>
      <Reveal className={`tile spotify ${compact ? "spotify--compact" : ""}`}><iframe src={embed} title="Playlist de Blackfit en Spotify" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" /></Reveal>
    </section>
  );
}
