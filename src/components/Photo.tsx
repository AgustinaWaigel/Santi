import Image, { type ImageProps } from "next/image";

// Las fotos subidas desde el admin se sirven tal cual, sin pasar por el optimizador.
export default function Photo({ src, alt, ...props }: ImageProps) {
  return <Image src={src} alt={alt} {...props} unoptimized={typeof src === "string" && src.startsWith("/uploads/")} />;
}
