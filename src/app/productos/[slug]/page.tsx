import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import AddToCart from "@/components/AddToCart"
import Carousel from "@/components/Carousel"
import FavoriteButton from "@/components/FavoriteButton"
import OutfitBuilder from "@/components/OutfitBuilder"
import Photo from "@/components/Photo"
import ProductGrid from "@/components/ProductGrid"
import SizeGuide from "@/components/SizeGuide"
import { formatPrice } from "@/data/products"
import { lockedUntil } from "@/lib/early"
import { siteUrl } from "@/lib/mercadopago"
import { onSale, totalStock } from "@/lib/pricing"
import { getSite } from "@/lib/store"

export async function generateMetadata({ params }: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const product = (await getSite()).products.find((item) => item.slug === slug)
  if (!product) return {}
  const description = product.description || `${product.name} · ${formatPrice(product.price)}`
  return { title: product.name, description, openGraph: { title: product.name, description, images: product.images.slice(0, 1) } }
}

export default async function ProductoPage({
  params,
}: PageProps<"/productos/[slug]">) {
  const { slug } = await params
  const { products, categories, collections, settings, orders } = await getSite()
  const product = products.find((item) => item.slug === slug)
  if (!product) notFound()
  const category = categories.find((item) => item.slug === product.category)
  const collection = collections.find((item) => item.slug === product.collection)
  const colors = product.family ? products.filter((item) => item.family === product.family) : []
  const outfit = product.outfit.flatMap((item) => products.find((candidate) => candidate.slug === item) ?? [])
  const related = products.filter((item) => item.category === product.category && item.slug !== product.slug && !colors.includes(item) && !outfit.includes(item)).slice(0, 3)
  const left = totalStock(product)
  // Total de la edición = lo que queda más lo ya vendido en pedidos que no se cancelaron.
  const sold = orders.filter((order) => order.status !== "cancelado").flatMap((order) => order.items).filter((item) => item.slug === product.slug).reduce((total, item) => total + item.qty, 0)
  // Datos estructurados para que los buscadores muestren precio, foto y disponibilidad.
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, color: product.color || undefined,
    image: product.images.map((image) => (image.startsWith("/") ? siteUrl() + image : image)),
    offers: { "@type": "Offer", price: product.price, priceCurrency: "ARS", availability: `https://schema.org/${left > 0 ? "InStock" : "OutOfStock"}`, url: `${siteUrl()}/productos/${product.slug}` },
  }

  return (
    <>
      <main className="product-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <div className="product-page__image product-photo">
          <Carousel label={`Fotos de ${product.name}`} zoomImages={product.images}>
            {product.images.map((image, index) => <Photo src={image} alt={`${product.name}, foto ${index + 1}`} fill preload={index === 0} sizes="(max-width: 800px) 100vw, 55vw" key={image} />)}
            {product.video && <video className="carousel__video" src={product.video} controls muted loop playsInline preload="metadata" aria-label={`Video de ${product.name}`} />}
          </Carousel>
          <FavoriteButton slug={product.slug} name={product.name} />
        </div>
        <div className="product-page__info">
          <div className="eyebrow">
            {category && <Link href={`/categorias/${category.slug}`}>{category.name}</Link>}
            {category && collection && " / "}
            {collection && <Link href={`/colecciones/${collection.slug}`}>{collection.name}</Link>}
          </div>
          <h1>{product.name}</h1>
          <p className="product-page__price">{onSale(product) && <s>{formatPrice(product.compareAt)}</s>}{formatPrice(product.price)} {product.color && <span>· {product.color}</span>}</p>
          <p>{product.description}</p>
          {product.limited && left > 0 && (
            <div className="stock-bar">
              <p>Edición limitada · <strong>quedan {left} de {left + sold}</strong></p>
              <progress max={left + sold} value={left} aria-label="Unidades disponibles" />
            </div>
          )}
          {colors.length > 1 && (
            <div className="add-to-cart__sizes product-page__colors">
              <span className="eyebrow">Color</span>
              <div className="chip-row">{colors.map((item) => <Link href={`/productos/${item.slug}`} className={`chip ${item === product ? "chip--active" : ""}`} aria-current={item === product ? "page" : undefined} key={item.slug}>{item.color || item.name}</Link>)}</div>
            </div>
          )}
          <AddToCart slug={product.slug} sizes={product.sizes} stock={product.stock} sizeRules={category?.sizeRules || settings.sizeRules} opensAt={await lockedUntil(settings, product)} />
          <SizeGuide text={category?.sizeGuide || settings.sizeGuide} />
          {(product.material || product.care) && (
            <details className="size-guide">
              <summary>Composición y cuidados</summary>
              <div className="size-guide__text">
                {product.material && <p><strong>Composición.</strong> {product.material}</p>}
                {product.care && <p><strong>Cuidados.</strong> {product.care}</p>}
              </div>
            </details>
          )}
        </div>
      </main>
      {outfit.length > 0 && (
        <section className="home-section">
          <div className="section-heading"><h2>Combinalo con</h2></div>
          <OutfitBuilder percent={settings.outfitDiscount} items={[product, ...outfit].map(({ slug, name, price, images, sizes, stock }) => ({ slug, name, price, images: images.slice(0, 1), sizes, stock }))} />
        </section>
      )}
      {related.length > 0 && (
        <section className="home-section">
          <div className="section-heading"><h2>También te puede gustar</h2></div>
          <ProductGrid products={related} scroll />
        </section>
      )}
      <div className="page-end" />
    </>
  )
}
