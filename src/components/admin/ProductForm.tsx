"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProduct } from "@/app/admin/actions";
import PhotoList from "@/components/admin/PhotoList";
import type { Group, Product } from "@/data/products";

export default function ProductForm({ product, categories, collections, others }: { product?: Product; categories: Group[]; collections: Group[]; others: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveProduct, { error: "" });
  const values = state.values ?? {
    name: product?.name ?? "",
    price: product ? String(product.price) : "",
    compareAt: product?.compareAt ? String(product.compareAt) : "",
    color: product?.color ?? "",
    category: product?.category ?? categories[0]?.slug ?? "",
    collection: product ? product.collection : collections[0]?.slug ?? "",
    family: product?.family ?? "",
    description: product?.description ?? "",
    stock: product ? product.sizes.map((size) => `${size}:${product.stock[size] ?? 0}`).join(", ") : "S:0, M:0, L:0, XL:0",
    isNew: product?.isNew ? "on" : "",
    material: product?.material ?? "",
    care: product?.care ?? "",
    limited: product?.limited ? "on" : "",
    outfit: product?.outfit.join(",") ?? "",
  };
  const outfit = values.outfit.split(",");

  return (
    <form action={action} className="admin-form">
      {product && <input type="hidden" name="originalSlug" value={product.slug} />}
      <label className="field field--wide"><span>Nombre</span><input name="name" defaultValue={values.name} required /></label>
      <label className="field"><span>Precio ($)</span><input name="price" type="number" min="0" step="1" inputMode="numeric" defaultValue={values.price} required /></label>
      <label className="field"><span>Precio anterior · solo si está en oferta</span><input name="compareAt" type="number" min="0" step="1" inputMode="numeric" defaultValue={values.compareAt} /></label>
      <label className="field"><span>Categoría</span>
        <select name="category" defaultValue={values.category} required>
          {categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Colección</span>
        <select name="collection" defaultValue={values.collection}>
          <option value="">Sin colección</option>
          {collections.map((collection) => <option value={collection.slug} key={collection.slug}>{collection.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Color</span><input name="color" defaultValue={values.color} /></label>
      <label className="field"><span>Modelo · mismo código en cada color del mismo producto</span><input name="family" placeholder="heavyweight-tee" defaultValue={values.family} /></label>
      <label className="field field--wide"><span>Talles y stock · talle:unidades, separados por coma</span><input name="stock" placeholder="S:5, M:3, L:0" defaultValue={values.stock} required /></label>
      <label className="field field--wide"><span>Descripción</span><textarea name="description" rows={4} defaultValue={values.description} /></label>
      <label className="field"><span>Composición</span><input name="material" placeholder="100% algodón, 240 g" defaultValue={values.material} /></label>
      <label className="field"><span>Cuidados</span><input name="care" placeholder="Lavar del revés con agua fría" defaultValue={values.care} /></label>
      <label className="check field--wide"><input type="checkbox" name="isNew" defaultChecked={values.isNew === "on"} /> Mostrar la etiqueta “Nuevo”</label>
      <label className="check field--wide"><input type="checkbox" name="limited" defaultChecked={values.limited === "on"} /> Edición limitada: mostrar cuántas unidades quedan</label>
      {others.length > 0 && (
        <fieldset className="field field--wide check-list">
          <legend>Combinalo con · prendas que arman el conjunto</legend>
          {others.map((other) => <label className="check" key={other.slug}><input type="checkbox" name="outfit" value={other.slug} defaultChecked={outfit.includes(other.slug)} /> {other.name}</label>)}
        </fieldset>
      )}

      {product && <PhotoList images={product.images} />}
      <label className="field field--wide"><span>{product ? "Agregar fotos" : "Fotos"} · JPG, PNG, WebP o AVIF, hasta 6 MB cada una</span><input type="file" name="photos" accept="image/jpeg,image/png,image/webp,image/avif" multiple /></label>

      <label className="field field--wide"><span>{product?.video ? "Reemplazar video" : "Video de la prenda"} · giro 360° o puesta, MP4 o WebM, hasta 40 MB</span><input type="file" name="video" accept="video/mp4,video/webm" /></label>
      {product?.video && <label className="check field--wide"><input type="checkbox" name="remove:video" /> Quitar el video actual</label>}

      <p className="form-error field--wide" role="alert">{state.error}</p>
      <div className="admin-form__actions field--wide">
        <button type="submit" className="btn" disabled={pending}>{pending ? "Guardando…" : product ? "Guardar cambios" : "Publicar producto"}</button>
        <Link href="/admin" className="btn btn--ghost">Cancelar</Link>
      </div>
    </form>
  );
}
