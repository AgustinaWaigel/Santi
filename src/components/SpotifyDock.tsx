"use client";

import { useEffect, useRef, useState } from "react";
import { spotifyUri } from "@/data/products";

type Controller = { addListener: (event: string, callback: (event: { data: { isPaused: boolean } }) => void) => void; pause: () => void; destroy: () => void };
type IFrameAPI = { createController: (element: HTMLElement, options: { uri: string; width: string; height: string }, callback: (controller: Controller) => void) => void };
declare global { interface Window { onSpotifyIframeApiReady?: (api: IFrameAPI) => void } }

// La API de Spotify llama a onSpotifyIframeApiReady una sola vez por carga de la página.
let spotifyApi: Promise<IFrameAPI> | null = null;
function loadSpotifyApi() {
  spotifyApi ??= new Promise((resolve) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);
  });
  return spotifyApi;
}

// Un único reproductor para todo el sitio: como está en el layout no se desmonta al navegar y la música no se corta.
// Si la página tiene un lugar reservado (data-spotify-slot) se dibuja encima; si no, y está sonando, queda flotando abajo.
export default function SpotifyDock({ url }: { url: string }) {
  const dock = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const [mode, setMode] = useState<"slot" | "float" | "hidden">("hidden");
  const [started, setStarted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const uri = spotifyUri(url);

  useEffect(() => {
    if (!uri || !host.current) return;
    let cancelled = false;
    const element = host.current;
    loadSpotifyApi().then((api) => {
      if (cancelled) return;
      api.createController(element, { uri, width: "100%", height: "100%" }, (created) => {
        controller.current = created;
        created.addListener("playback_update", ({ data }) => {
          if (data.isPaused) return;
          setStarted(true);
          setDismissed(false);
        });
      });
    });
    return () => { cancelled = true; controller.current?.destroy(); controller.current = null; };
  }, [uri]);

  // Sigue al lugar reservado cuadro a cuadro: la página puede moverse mientras cargan fotos o cambia de ruta.
  useEffect(() => {
    if (!uri) return;
    let frame = 0;
    let last = "";
    const follow = () => {
      const slot = document.querySelector<HTMLElement>("[data-spotify-slot]");
      const element = dock.current;
      if (element) {
        let next = "";
        if (slot) {
          const rect = slot.getBoundingClientRect();
          next = `${rect.top + window.scrollY}|${rect.left + window.scrollX}|${rect.width}|${rect.height}`;
        }
        if (next !== last) {
          last = next;
          const [top, left, width, height] = next.split("|");
          element.style.top = slot ? `${top}px` : "";
          element.style.left = slot ? `${left}px` : "";
          element.style.width = slot ? `${width}px` : "";
          element.style.height = slot ? `${height}px` : "";
          setMode(slot ? "slot" : "float");
        }
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [uri]);

  if (!uri) return null;
  const visible = mode === "slot" || (mode === "float" && started && !dismissed);
  return (
    <div ref={dock} className={`spotify-dock spotify-dock--${mode} ${visible ? "" : "spotify-dock--hidden"}`} aria-hidden={!visible}>
      <div className="spotify-dock__player"><div ref={host} /></div>
      {mode === "float" && (
        <button type="button" className="spotify-dock__close" aria-label="Cerrar reproductor" onClick={() => { controller.current?.pause(); setDismissed(true); }}>×</button>
      )}
    </div>
  );
}
