export const GROUP_KINDS = {
  categorias: { key: "categories", title: "Categorías", one: "categoría", newLabel: "Nueva categoría" },
  colecciones: { key: "collections", title: "Colecciones", one: "colección", newLabel: "Nueva colección" },
} as const;

export type GroupKind = keyof typeof GROUP_KINDS;

export const isGroupKind = (value: string): value is GroupKind => Object.hasOwn(GROUP_KINDS, value);
