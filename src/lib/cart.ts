import { useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";

export type CartItem = { slug: string; size: string; qty: number };

const store = createLocalStore<CartItem>("blackfit-cart");
const same = (item: CartItem, slug: string, size: string) => item.slug === slug && item.size === size;

export function addItem(slug: string, size: string) {
  const current = store.get();
  store.set(current.some((item) => same(item, slug, size))
    ? current.map((item) => (same(item, slug, size) ? { ...item, qty: item.qty + 1 } : item))
    : [...current, { slug, size, qty: 1 }]);
}

export function setQty(slug: string, size: string, qty: number) {
  const current = store.get();
  store.set(qty <= 0
    ? current.filter((item) => !same(item, slug, size))
    : current.map((item) => (same(item, slug, size) ? { ...item, qty } : item)));
}

export const clearCart = () => store.set([]);

// Panel lateral del carrito: se abre al agregar una prenda.
let drawerOpen = false;
const drawerListeners = new Set<() => void>();
const watchDrawer = (listener: () => void) => {
  drawerListeners.add(listener);
  return () => { drawerListeners.delete(listener); };
};

export function setCartDrawer(open: boolean) {
  drawerOpen = open;
  drawerListeners.forEach((listener) => listener());
}

export const useCartDrawer = () => useSyncExternalStore(watchDrawer, () => drawerOpen, () => false);
export const useCart = store.use;
