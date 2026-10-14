import { useSyncExternalStore } from "react";

// Lista guardada en el navegador y compartida entre componentes y pestañas.
export function createLocalStore<T>(key: string) {
  const EMPTY: T[] = [];
  const listeners = new Set<() => void>();
  let items = EMPTY;
  let loaded = false;

  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? "[]");
      items = Array.isArray(stored) ? stored : EMPTY;
    } catch {
      items = EMPTY;
    }
    loaded = true;
  }

  function get() {
    if (!loaded) load();
    return items;
  }

  function set(next: T[]) {
    items = next;
    loaded = true;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Sin almacenamiento disponible la lista vive solo en memoria.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      load();
      listener();
    };
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { get, set, use: () => useSyncExternalStore(subscribe, get, () => EMPTY) };
}
