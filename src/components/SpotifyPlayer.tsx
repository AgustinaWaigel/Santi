import Reveal from "@/components/Reveal";
import { spotifyEmbed } from "@/data/products";

// Lugar reservado para la playlist; el reproductor de verdad vive en el layout (SpotifyDock) y se acomoda encima
// para que la música siga sonando al cambiar de página. `compact` usa la versión baja.
export default function SpotifyPlayer({ url, compact = false }: { url: string; compact?: boolean }) {
  if (!spotifyEmbed(url)) return null;
  return (
    <section className="home-section">
      <Reveal className="section-heading"><h2>Suena en Blackfit</h2><a href={url} target="_blank" rel="noopener noreferrer">Abrir en Spotify <span aria-hidden="true">→</span></a></Reveal>
      <div className={`tile spotify ${compact ? "spotify--compact" : ""}`} data-spotify-slot />
    </section>
  );
}
