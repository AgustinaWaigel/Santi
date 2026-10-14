"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/admin/actions";
import PhotoList from "@/components/admin/PhotoList";
import Photo from "@/components/Photo";
import type { Group, Settings } from "@/data/products";

const PHOTO_TYPES = "image/jpeg,image/png,image/webp,image/avif";

export default function SettingsForm({ settings, collections }: { settings: Settings; collections: Group[] }) {
  const [state, action, pending] = useActionState(saveSettings, { error: "" });
  const value = (name: Exclude<keyof Settings, "lookbook" | "pickup" | "wheelEnabled" | "showRecentSales">) => state.values?.[name] ?? String(settings[name] || "");
  const pickup = state.values ? state.values.pickup === "on" : settings.pickup;
  const wheelEnabled = state.values ? state.values.wheelEnabled === "on" : settings.wheelEnabled;
  const showRecentSales = state.values ? state.values.showRecentSales === "on" : settings.showRecentSales;

  return (
    <form action={action} className="admin-form">
      <h2 className="field--wide">Inicio</h2>
      <label className="field field--wide"><span>Barra superior</span><input name="promo" defaultValue={value("promo")} /></label>
      <label className="field field--wide"><span>Frase de portada · una línea por renglón</span><textarea name="heroTagline" rows={2} defaultValue={value("heroTagline")} /></label>
      <div className="field field--wide photo-list">
        <span className="photo-list__item"><span className="product-photo"><Photo src={settings.heroImage} alt="" fill sizes="160px" /></span><span>Foto de portada</span></span>
      </div>
      <label className="field field--wide"><span>Reemplazar foto de portada · hasta 6 MB</span><input type="file" name="heroImage" accept={PHOTO_TYPES} /></label>
      <label className="field field--wide"><span>{settings.heroVideo ? "Reemplazar video de portada" : "Video de portada"} · clip corto sin sonido, MP4 o WebM, hasta 40 MB · se reproduce en loop sobre la foto</span><input type="file" name="heroVideo" accept="video/mp4,video/webm" /></label>
      {settings.heroVideo && <label className="check field--wide"><input type="checkbox" name="remove:heroVideo" /> Quitar el video de portada</label>}
      <label className="field field--wide"><span>Título del manifiesto · una línea por renglón</span><textarea name="manifestoTitle" rows={2} defaultValue={value("manifestoTitle")} /></label>
      <label className="field field--wide"><span>Texto del manifiesto</span><textarea name="manifestoText" rows={4} defaultValue={value("manifestoText")} /></label>

      <label className="field field--wide"><span>Playlist de Spotify · pegá el enlace de Compartir → Copiar enlace · vacío para ocultarla</span><input name="spotify" type="url" placeholder="https://open.spotify.com/playlist/…" defaultValue={value("spotify")} /></label>
      <label className="check field--wide"><input type="checkbox" name="showRecentSales" defaultChecked={showRecentSales} /> Mostrar el cartel de compras recientes (solo ciudad y prenda de pedidos reales)</label>
      <label className="check field--wide"><input type="checkbox" name="wheelEnabled" defaultChecked={wheelEnabled} /> Ruleta de bienvenida · sortea los códigos marcados “ruleta” en Descuentos</label>

      <h2 className="field--wide">Carrusel</h2>
      <PhotoList images={settings.lookbook} />
      <label className="field field--wide"><span>Agregar fotos al carrusel · hasta 6 MB cada una</span><input type="file" name="lookbook" accept={PHOTO_TYPES} multiple /></label>

      <h2 className="field--wide">Próximo drop</h2>
      <label className="field"><span>Título</span><input name="dropTitle" defaultValue={value("dropTitle")} /></label>
      <label className="field"><span>Fecha y hora · vacío para ocultar la cuenta regresiva</span><input name="dropDate" type="datetime-local" defaultValue={value("dropDate")} /></label>

      <label className="field field--wide"><span>Colección del drop · sus productos no se pueden comprar hasta esa fecha</span>
        <select name="dropCollection" defaultValue={value("dropCollection")}>
          <option value="">Ninguna: todo se vende siempre</option>
          {collections.map((collection) => <option value={collection.slug} key={collection.slug}>{collection.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Código de acceso anticipado · vacío para no ofrecerlo</span><input name="earlyCode" defaultValue={value("earlyCode")} /></label>
      <label className="field"><span>Minutos de ventaja con el código</span><input name="earlyMinutes" type="number" min="0" step="1" defaultValue={value("earlyMinutes")} /></label>
      <p className="form-note field--wide">La fecha se toma en hora de Argentina. El código se lo mandás vos a quienes se anotaron (están en Pedidos) y lo activan en /acceso.</p>

      <h2 className="field--wide">Conjuntos</h2>
      <label className="field"><span>Descuento por llevar el conjunto completo (%) · vacío para no ofrecerlo</span><input name="outfitDiscount" type="number" min="0" max="90" step="1" defaultValue={value("outfitDiscount")} /></label>

      <h2 className="field--wide">Envíos</h2>
      <label className="field"><span>Costo de envío base ($)</span><input name="shippingDefault" type="number" min="0" step="1" defaultValue={value("shippingDefault")} /></label>
      <label className="field"><span>Envío gratis desde ($) · vacío para no ofrecerlo</span><input name="freeShippingFrom" type="number" min="0" step="1" defaultValue={value("freeShippingFrom")} /></label>
      <label className="field field--wide"><span>Zonas por código postal · una por línea: desde-hasta: costo</span><textarea name="shippingZones" rows={4} placeholder={"1000-1499: 3000\n1500-1999: 4500"} defaultValue={value("shippingZones")} /></label>
      <label className="check field--wide"><input type="checkbox" name="pickup" defaultChecked={pickup} /> Ofrecer retiro en persona, sin costo</label>
      <label className="field field--wide"><span>Dónde y cuándo se retira</span><input name="pickupNote" defaultValue={value("pickupNote")} /></label>

      <h2 className="field--wide">Contacto</h2>
      <label className="field"><span>WhatsApp · con código de país, solo números</span><input name="whatsapp" inputMode="tel" placeholder="5491122334455" defaultValue={value("whatsapp")} /></label>
      <label className="field"><span>Instagram · usuario sin @</span><input name="instagram" defaultValue={value("instagram")} /></label>
      <label className="field field--wide"><span>Email</span><input name="email" type="email" defaultValue={value("email")} /></label>

      <h2 className="field--wide">Páginas</h2>
      <label className="field field--wide"><span>Nosotros · título</span><input name="aboutTitle" defaultValue={value("aboutTitle")} /></label>
      <label className="field field--wide"><span>Nosotros · texto</span><textarea name="aboutText" rows={5} defaultValue={value("aboutText")} /></label>
      <label className="field field--wide"><span>Envíos y devoluciones</span><textarea name="shippingText" rows={6} defaultValue={value("shippingText")} /></label>
      <label className="field field--wide"><span>Términos y privacidad</span><textarea name="termsText" rows={6} defaultValue={value("termsText")} /></label>
      <label className="field field--wide"><span>Guía de talles · una fila por línea, columnas separadas por |</span><textarea name="sizeGuide" rows={5} placeholder={"Talle | Pecho (cm) | Largo (cm)\nS | 52 | 70\nM | 55 | 72"} defaultValue={value("sizeGuide")} /></label>
      <label className="field field--wide"><span>Calculadora de talles · talle: altura, peso de quien lo usa · una regla por línea, de menor a mayor</span><textarea name="sizeRules" rows={5} placeholder={"S: 158-170 cm, 50-64 kg\nM: 166-178 cm, 62-76 kg"} defaultValue={value("sizeRules")} /></label>
      <p className="form-note field--wide">Los valores iniciales de la calculadora son de ejemplo: reemplazalos por las medidas reales de tus prendas. Cada categoría puede tener su propia guía y sus propias reglas.</p>

      <p className={`form-error field--wide ${state.saved ? "form-ok" : ""}`} role="status">{state.saved ? "Cambios guardados." : state.error}</p>
      <div className="admin-form__actions field--wide">
        <button type="submit" className="btn" disabled={pending}>{pending ? "Guardando…" : "Guardar cambios"}</button>
      </div>
    </form>
  );
}
