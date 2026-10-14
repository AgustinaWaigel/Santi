import type { Metadata } from "next";
import LookSpots from "@/components/LookSpots";
import Photo from "@/components/Photo";
import Reveal from "@/components/Reveal";
import { cropClass, formatPrice } from "@/data/products";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Lookbook" };

export default async function LookbookPage() {
  const { looks, products, settings, collections } = await getSite();
  // Mientras no haya fotos cargadas en el lookbook se muestran las del carrusel del inicio, sin puntos.
  const shown = looks.length > 0 ? looks : settings.lookbook.map((image) => ({ id: image, image, spots: [] }));
  return (
    <main className="shop-page">
      <p className="eyebrow">{collections.at(0)?.name ?? "Blackfit"} / {String(shown.length).padStart(2, "0")} looks</p>
      <h1>Lookbook</h1>
      {looks.some((look) => look.spots.length > 0) && <p className="lookbook__hint">Tocá los puntos para ver cada prenda.</p>}
      <div className="lookbook">
        {shown.map((look, index) => (
          <Reveal className={`tile look ${cropClass(look.image)}`} key={look.id}>
            <Photo src={look.image} alt={`Look ${index + 1}`} fill sizes="(max-width: 800px) 100vw, 50vw" preload={index === 0} />
            <LookSpots spots={look.spots.flatMap((spot) => {
              const product = products.find((item) => item.slug === spot.slug);
              return product ? [{ ...spot, name: product.name, price: formatPrice(product.price) }] : [];
            })} />
          </Reveal>
        ))}
      </div>
    </main>
  );
}
