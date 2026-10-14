import { useSyncExternalStore } from "react";

// El reloj se lee solo en el navegador: en el servidor no hay "ahora" que valga para todos.
const tick = (listener: () => void) => {
  const timer = setInterval(listener, 1000);
  return () => clearInterval(timer);
};
const now = () => Math.floor(Date.now() / 1000);

// Segundos actuales, actualizados una vez por segundo; null mientras se arma la página en el servidor.
export const useNow = () => useSyncExternalStore(tick, now, () => null);
