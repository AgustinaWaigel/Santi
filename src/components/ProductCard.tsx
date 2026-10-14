import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import Photo from "@/components/Photo";
import QuickView from "@/components/QuickView";
import { formatPrice, type Product } from "@/data/products";
import { onSale, productTag } from "@/lib/pricing";

// `dropAt` (hora de lanzamiento, o null) habilita la vista rápida; sin ese dato la tarjeta solo enlaza a la ficha.
export default function ProductCard({ product, collection, dropAt }: { product: Product; collection?: string; dropAt?: number | null }) {
  const tag = productTag(product, collection);
  return (
    <article className="product-card">
      <Link href={`/productos/${product.slug}`}>
        <div className="product-card__image product-photo">
          {product.images[0] && <Photo src={product.images[0]} alt={product.name} fill sizes="(max-width: 800px) 82vw, 31vw" />}
          {product.images[1] && <Photo src={product.images[1]} alt="" fill sizes="(max-width: 800px) 82vw, 31vw" className="product-card__alt" />}
          {tag && <span className={`tag ${tag === "Agotado" ? "tag--muted" : ""}`}>{tag}</span>}
        </div>
        <div className="product-card__details">
          <div><strong>{product.name}</strong><span>{product.color}</span></div>
          <span className="product-card__price">{onSale(product) && <s>{formatPrice(product.compareAt)}</s>}{formatPrice(product.price)}</span>
        </div>
      </Link>
      <FavoriteButton slug={product.slug} name={product.name} />
      {dropAt !== undefined && <QuickView product={product} dropAt={dropAt} />}
    </article>
  );
}
