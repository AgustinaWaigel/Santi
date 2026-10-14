import Link from "next/link";
import Carousel from "@/components/Carousel";
import Countdown from "@/components/Countdown";
import Photo from "@/components/Photo";
import ProductGrid from "@/components/ProductGrid";
import Reveal from "@/components/Reveal";
import { cropClass, spotifyEmbed } from "@/data/products";
import { getSite } from "@/lib/store";

export default async function Home() {
  const { products, categories, collections, settings, community } = await getSite();
  const collection = collections.at(0);
  const spotify = spotifyEmbed(settings.spotify);
  const marquee = ["Blackfit", "Streetwear", "Wear your identity", "Built for the culture", ...collections.map((item) => item.name)];
  return (
    <main>
      <section className="hero">
        <div className="tile hero__main">
          <Photo src={settings.heroImage} alt="Campaña Blackfit" fill preload sizes="(max-width: 800px) 100vw, 66vw" />
          {settings.heroVideo && <video className="hero__video" src={settings.heroVideo} autoPlay muted loop playsInline aria-hidden="true" />}
          <div className="hero__shade" />
          <div className="hero__content">
            <span className="eyebrow">{collection?.name ?? "Streetwear"}</span>
            <h1 className="hero__title"><span>Blackfit</span></h1>
            <div className="hero__bottom">
              <p className="hero__tagline">{settings.heroTagline}</p>
              <div className="hero__actions"><Link href="/productos" className="btn">Ver colección</Link><Link href="/lookbook" className="btn btn--ghost">Lookbook</Link></div>
            </div>
          </div>
        </div>
        <div className="tile tile--red hero__outline" aria-hidden="true"><span>Black</span><span>Fit</span></div>
        <Link href={collection ? `/colecciones/${collection.slug}` : "/productos"} className="tile tile--green hero__drop">
          <span className="eyebrow">{collection ? "Nueva colección" : "Tienda"}</span>
          <strong>{collection?.name ?? "Ver todo"}</strong>
          <span className="eyebrow">Ver <span className="arrow">→</span></span>
        </Link>
        <div className={`tile hero__side ${collection ? cropClass(collection.image) : ""}`}>{collection && <Photo src={collection.image} alt="" fill sizes="(max-width: 800px) 50vw, 17vw" />}</div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((word, index) => <span key={index}>{word}</span>)}
        </div>
      </div>

      {settings.dropDate && <Countdown title={settings.dropTitle} date={settings.dropDate} />}

      <section className="home-section">
        <Reveal className="section-heading"><h2>Recién llegado</h2><Link href="/productos">Ver todo <span aria-hidden="true">→</span></Link></Reveal>
        <ProductGrid products={products.slice(0, 3)} scroll />
      </section>

      <section className={`home-section editorial ${settings.lookbook.length === 0 ? "editorial--solo" : ""}`}>
        {settings.lookbook.length > 0 && (
          <Reveal className="tile editorial__image">
            <Carousel label="Lookbook">
              {settings.lookbook.map((image, index) => <div className={`carousel__photo ${cropClass(image)}`} key={image}><Photo src={image} alt={`Lookbook Blackfit, foto ${index + 1}`} fill sizes="(max-width: 800px) 100vw, 58vw" /></div>)}
            </Carousel>
          </Reveal>
        )}
        <Reveal className="tile tile--red editorial__copy">
          <span className="eyebrow">Manifiesto</span>
          <h2>{settings.manifestoTitle}</h2>
          <p>{settings.manifestoText}</p>
          <Link href="/productos" className="btn btn--light">Descubrir la tienda</Link>
        </Reveal>
      </section>

      {categories.length > 0 && (
        <section className="home-section">
          <Reveal className="section-heading"><h2>Categorías</h2></Reveal>
          <Reveal stagger className="category-grid">
            {categories.map((category) => (
              <Link href={`/categorias/${category.slug}`} className={`tile category-card ${cropClass(category.image)}`} key={category.slug}>
                <Photo src={category.image} alt="" fill sizes="(max-width: 800px) 50vw, 25vw" /><span>{category.name}</span>
              </Link>
            ))}
          </Reveal>
        </section>
      )}

      {spotify && (
        <section className="home-section">
          <Reveal className="section-heading"><h2>Suena en Blackfit</h2><a href={settings.spotify} target="_blank" rel="noopener noreferrer">Abrir en Spotify <span aria-hidden="true">→</span></a></Reveal>
          <Reveal className="tile spotify"><iframe src={spotify} title="Playlist de Blackfit en Spotify" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" /></Reveal>
        </section>
      )}

      {community.length > 0 && (
        <section className="home-section">
          <Reveal className="section-heading"><h2>En la calle</h2></Reveal>
          <Reveal stagger className="community">
            {community.slice(0, 8).map((photo) => {
              const product = products.find((item) => item.slug === photo.slug);
              const content = <><Photo src={photo.image} alt={photo.caption || "Foto de un cliente"} fill sizes="(max-width: 800px) 50vw, 25vw" />{(photo.caption || product) && <span>{photo.caption}{product && <strong>{product.name} →</strong>}</span>}</>;
              return product ? <Link href={`/productos/${product.slug}`} className="tile community__photo" key={photo.id}>{content}</Link> : <div className="tile community__photo" key={photo.id}>{content}</div>;
            })}
          </Reveal>
        </section>
      )}
      <div className="page-end" />
    </main>
  );
}
