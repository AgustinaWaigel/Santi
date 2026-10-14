"use client";

import { Children, useRef, useState, type ReactNode } from "react";
import Photo from "@/components/Photo";

// Con `zoomImages` (una dirección por foto, en el mismo orden) cada foto se puede ampliar a pantalla completa.
export default function Carousel({ children, label, zoomImages }: { children: ReactNode; label: string; zoomImages?: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const slides = Children.toArray(children);

  function goTo(next: number) {
    const element = track.current;
    if (element) element.scrollTo({ left: element.clientWidth * next });
  }

  function onScroll() {
    const element = track.current;
    if (element) setIndex(Math.round(element.scrollLeft / element.clientWidth));
  }

  return (
    <div className="carousel" role="group" aria-roledescription="carrusel" aria-label={label}>
      <div className="carousel__track" ref={track} onScroll={onScroll}>
        {slides.map((slide, position) => (
          <div className="carousel__slide" role="group" aria-roledescription="foto" aria-label={`${position + 1} de ${slides.length}`} key={position}>{slide}</div>
        ))}
      </div>
      {zoomImages?.[index] && (
        <>
          <button type="button" className="carousel__zoom" aria-label="Ampliar foto" onClick={() => zoom.current?.showModal()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm5-1.5L20 20M10.5 8v5M8 10.5h5" /></svg>
          </button>
          <dialog ref={zoom} className="zoom" aria-label="Foto ampliada" onClick={() => zoom.current?.close()}>
            <Photo src={zoomImages[index]} alt={`${label}, foto ${index + 1} ampliada`} fill sizes="100vw" />
            <button type="button" className="header-icon" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </dialog>
        </>
      )}
      {slides.length > 1 && (
        <div className="carousel__controls">
          <div className="carousel__dots">
            {slides.map((_, position) => (
              <button type="button" className={position === index ? "is-active" : ""} aria-label={`Ir a la foto ${position + 1}`} aria-current={position === index} onClick={() => goTo(position)} key={position} />
            ))}
          </div>
          <span className="carousel__count" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
          <button type="button" className="carousel__arrow" aria-label="Foto anterior" disabled={index === 0} onClick={() => goTo(index - 1)}>←</button>
          <button type="button" className="carousel__arrow" aria-label="Foto siguiente" disabled={index === slides.length - 1} onClick={() => goTo(index + 1)}>→</button>
        </div>
      )}
    </div>
  );
}
