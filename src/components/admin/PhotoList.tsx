import Photo from "@/components/Photo";

// Fotos ya cargadas: el número define el orden y la casilla las quita al guardar.
export default function PhotoList({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  return (
    <fieldset className="field field--wide photo-list">
      <legend>Fotos actuales · cambiá el número para reordenar, marcá para quitar</legend>
      {images.map((image, index) => (
        <div className="photo-list__item" key={image}>
          <span className="product-photo"><Photo src={image} alt={`Foto ${index + 1}`} fill sizes="160px" /></span>
          <span className="photo-list__controls">
            <input type="number" name={`order:${image}`} min="1" defaultValue={index + 1} aria-label={`Orden de la foto ${index + 1}`} />
            <label><input type="checkbox" name="remove" value={image} /> Quitar</label>
          </span>
        </div>
      ))}
    </fieldset>
  );
}
