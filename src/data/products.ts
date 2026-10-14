// Categorías y colecciones comparten forma: un nombre, su dirección y una foto.
// Las categorías pueden traer además su propia guía de talles y sus reglas para la calculadora.
export type Group = { slug: string; name: string; image: string; sizeGuide?: string; sizeRules?: string };

export type Product = {
  slug: string;
  name: string;
  color: string;
  price: number;
  category: string;
  collection: string;
  images: string[];
  description: string;
  sizes: string[];
  // Unidades disponibles por talle.
  stock: Record<string, number>;
  // Precio anterior; si es mayor al precio actual el producto se muestra en oferta. 0 = sin oferta.
  compareAt: number;
  isNew: boolean;
  // Código compartido por los productos que son el mismo modelo en otro color.
  family: string;
  material: string;
  care: string;
  // Edición limitada: la ficha muestra cuántas unidades quedan del total.
  limited: boolean;
  // Productos con los que se combina; llevarlos todos juntos activa el descuento por conjunto.
  outfit: string[];
  // Video corto de la prenda (giro 360° o puesta); se muestra como última diapositiva de la ficha.
  video: string;
};

export const ORDER_STATUSES = ["pendiente", "pagado", "enviado", "cancelado"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  items: { slug: string; name: string; size: string; qty: number; price: number }[];
  subtotal: number;
  coupon: string;
  discount: number;
  bundleDiscount: number;
  tracking: string;
  shipping: { method: "envio" | "retiro"; cost: number };
  total: number;
  customer: { name: string; phone: string; email: string; address: string; city: string; zip: string; notes: string };
  paymentId: string;
};

// `wheel`: el código puede salir como premio en la ruleta de bienvenida.
export type Coupon = { code: string; percent: number; wheel?: boolean };
export type Subscriber = { contact: string; createdAt: string; source?: "ruleta" };
// Foto del lookbook con puntos sobre las prendas; x e y son porcentajes del ancho y el alto de la foto.
export type Look = { id: string; image: string; spots: { x: number; y: number; slug: string }[] };
export type RestockRequest = { slug: string; size: string; contact: string; createdAt: string };
export type CommunityPhoto = { id: string; image: string; slug: string; caption: string };

export type Settings = {
  promo: string;
  heroImage: string;
  heroVideo: string;
  wheelEnabled: boolean;
  showRecentSales: boolean;
  heroTagline: string;
  manifestoTitle: string;
  manifestoText: string;
  lookbook: string[];
  whatsapp: string;
  instagram: string;
  email: string;
  // Enlace de Spotify (playlist, álbum o artista) que suena en el inicio.
  spotify: string;
  dropTitle: string;
  // Fecha y hora local del próximo lanzamiento, con el formato de un campo datetime-local. Vacío = sin cuenta regresiva.
  dropDate: string;
  pickup: boolean;
  pickupNote: string;
  shippingDefault: number;
  // Una zona por línea: "1000-1999: 3500" (rango de códigos postales y costo).
  shippingZones: string;
  freeShippingFrom: number;
  // Una fila por línea, columnas separadas por "|". La primera línea es el encabezado.
  sizeGuide: string;
  // Calculadora de talles, una regla por línea: "M: 168-178 cm, 65-78 kg" (altura y peso de quien usa ese talle).
  sizeRules: string;
  outfitDiscount: number;
  // Colección del próximo drop: sus productos no se pueden comprar hasta la fecha, salvo con el código de acceso anticipado.
  dropCollection: string;
  earlyCode: string;
  earlyMinutes: number;
  aboutTitle: string;
  aboutText: string;
  shippingText: string;
  termsText: string;
};

export type Site = { products: Product[]; categories: Group[]; collections: Group[]; settings: Settings; orders: Order[]; coupons: Coupon[]; subscribers: Subscriber[]; restock: RestockRequest[]; community: CommunityPhoto[]; looks: Look[] };

// Sin el sufijo de tamaño el servidor devuelve una miniatura de 512px.
const img = (id: string) => `https://lh3.googleusercontent.com/aida-public/${id}=w1600`;

const heroImage = img("AB6AXuDjUVsX2wo4CXXJSe6UQrabX7bzAkTj9_pJ0qmqCqTAJLq7Bflb9a6GQiGjO4fA597Oz2BMNPU1ovjZKorCg9om81TwrQZV7e3drb5MmqRyAxblbKBZzhfrsuNZSVv9Z3jLyQgk3lwRZdSqE-_LMY2ZHq0YNFvQfHRWAV1EpM4w-NAyGvAviIHhHFX064iX0nCiryGdeF8sGSpTntR6t3sGGsVMOtPWiiI77gIAcsGPz02yD1i9i5T5");
const editorialImage = img("AB6AXuDuGuir1TCypXu-KmUuzqio6Oiwdd9ROYXphTCMK6MfLx-cGPeGIpD-AB4MPJHnITnGJE-2amH0GaqOb_XfCrpV-BTgNualxhs8qOB17jDbZZvQtwRm18CqWlbCpNB1HwO3_mACgj8uwhV9NWm7uYrlIyDtSkzUMUdKk793-k0jIgGtbCws49IlKCi-QOhe5v73A1c7_OXFWo3k07Fto67qjpeky22iomrnsg8movX234H8f8AaChvr");

const categories: Group[] = [
  { slug: "remeras", name: "Remeras", image: img("AB6AXuCmXq00WwzwcGxtGClfSsnQ0bGPNPzSWEBmLMv8dvnsRAXYdYlIR0p2ZtE-vNTz36ibpgazLuWahOK7mPQfEB3giWaVUVpbkjzXjrhQQ9VbtEyXhGfSs7aAyIgVHIigTRD7vIqLNmLhCzC_bwcoUUPzdWvJL0siCr3FGu8DEpCsNNqKvdYUZXeHt1acJdm60jWeiBZQInNuLQA76R1J3zx8HAP4RKljm9k_i4kDFzdLfQdNm7Lf5Htm") },
  { slug: "buzos", name: "Buzos", image: img("AB6AXuAZUPG1KrD6c3lfwaYeBiumjk9ec6UdpC_bVX2BMyLA4mILIhBpZLLbSaPWmiv3qNTzbTOlQO6JFpvHv_Qk6QvloXhDHWD0-Yg1XX4FFSgaVZ0noiZ57846tDiVoQUw-nNfHSJuUX5SKGXERXa9dNYXbxirZT2x6cBYLh0POPqL-Itzh_K5pURr_jZBBQ2-Jxj7ox_bRIv_ncMIaBtH89KPx0h40hiwbphzdgfNdGKaQu5YhNg4nQPU") },
  { slug: "pantalones", name: "Pantalones", image: img("AB6AXuALd6xLdVcj2dMwZuw-hvICOvxQsefKNC5e9uUTZQZHrVZ1OowyI4lb1WufQ-bNIY6XFKrkgM6_rSlE4wQn_f7Cr7dGzY0gx4BIXGflT2dFaCAZqI0_yUfR3UdxHETPc2ZhisvZqn5mE1Fjkvy4d710CkoMKkAy8atkxxjer-lUBhuFzII2hYHJPmLLuXrIaeLoviUPpeY4N-81G1YMBtZ_58ajET-WLjcvW7feniT9WUx8afeVCKT2") },
  { slug: "camperas", name: "Camperas", image: img("AB6AXuBBkMtF3H1S_6ILdbsUAFePtiqWqOSQn_Xv2txmCvdO-G-oUAbcDGpevBfXmMIQ7gddIr_--va-94OB49_gG9vwBIwLDBkPxKLGCpacM__f1rH-AYbQoOwkrul8pD9W1TFTYGaOwJ245ni5OnymOmPzVKa-vYuXTPsFIYUijeSvmFP8vCn4QZNm0xKWO5WP8lJsebTx1453vkCYbh6YI0lYTFR6kXIIzDfPf6djayuME9ycvOzLAwjl") },
];

const products: Product[] = [
  {
    slug: "heavyweight-tee-01",
    name: "Heavyweight Tee 01",
    color: "Negro",
    price: 120,
    category: "remeras",
    collection: "drop-01",
    images: [img("AB6AXuBn3V3830wHyBHly62Gx5uxFCSL6HDC-JaQadm33WDjNCdPFzdjt3S9auf3zhpusi-Z9xPpLNyhmrTsLPq4zMSHUJ7fAUfc5SLtbujCAmrxapZCphGSaCixp8_m0_zv0vBfl2f0b8s5tv7GPR7S2p0QXeD55IKk9nptzy7SOXF2BXyB2U59yNMVBH4LTwv2ubtIqVr_BOWzEwhWai7AeDIAHWiyNAmjJ0qebuk9fi_xeo1MA1lEW_O1")],
    description: "Remera oversize de algodón pesado, con caída recta y cuello reforzado.",
    sizes: ["S", "M", "L", "XL"],
    stock: { "S": 10, "M": 10, "L": 10, "XL": 10 },
    compareAt: 0,
    isNew: false,
    family: "",
    material: "",
    care: "",
    limited: false,
    outfit: [],
    video: "",
  },
  {
    slug: "tech-cargo-pant",
    name: "Tech Cargo Pant",
    color: "Carbón",
    price: 280,
    category: "pantalones",
    collection: "drop-01",
    images: [img("AB6AXuBZ0tAez_p_EN4-TNsS_0gjdETahYONMx-HgKheDgfR7Hjfv88u_XdmiXTWzVR-dGmDUuvLfvtv0GClOMsnFs-Nd3mmG4actGK9TKPdDQApMqV5UiNfKDQlFov47wj_gdeCwXbbv768BaFztd8TyMgWmoY9z_6UHqYT1oELa6FKmezddX94raGbq8Jv8QJCbS_Nwe4amxjpZTZcAcYORrODArSSL-EWIipu6Z0fJTVF40WZkguWFsqz")],
    description: "Cargo de tela técnica con bolsillos laterales y ajuste en el tobillo.",
    sizes: ["38", "40", "42", "44"],
    stock: { "38": 10, "40": 10, "42": 10, "44": 10 },
    compareAt: 0,
    isNew: false,
    family: "",
    material: "",
    care: "",
    limited: false,
    outfit: [],
    video: "",
  },
  {
    slug: "structured-bomber",
    name: "Structured Bomber",
    color: "Oliva",
    price: 450,
    category: "camperas",
    collection: "drop-01",
    images: [img("AB6AXuBo5KtztLH6sbUosMTMsm2jwoXDdB5RRC-Kmi4VJu7goqOjG01jAM0DifWZmnGQ9HPKs5m3Z6R78dH1Dyx8CrogIQGfHx4d8UVuS69h5XGxmYH0LdYymOSh93cfgvl0f1Y_q0VfFLm9EUC3a0UPmGB322m5gACUJXWlsVz_8aI-3IxE9xrVx953FqrX_s6B46dqOAqP4-kIelaXcZPKDtCk6DpEa-g6QoJK3n7mEV3301Qg1-Rzwrdq")],
    description: "Bomber de silueta estructurada, forrada, con cierre metálico.",
    sizes: ["S", "M", "L", "XL"],
    stock: { "S": 10, "M": 10, "L": 10, "XL": 10 },
    compareAt: 0,
    isNew: false,
    family: "",
    material: "",
    care: "",
    limited: false,
    outfit: [],
    video: "",
  },
];

// Convierte un enlace de Spotify en la dirección de su reproductor para insertar; null si no es un enlace válido.
export function spotifyEmbed(url: string) {
  const match = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist|track)\/([A-Za-z0-9]+)/);
  return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0` : null;
}

// Igual que spotifyEmbed pero en formato spotify:tipo:id, el que pide la API de Spotify para controlar el reproductor.
export function spotifyUri(url: string) {
  const match = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist|track)\/([A-Za-z0-9]+)/);
  return match ? `spotify:${match[1]}:${match[2]}` : null;
}

export const formatPrice = (price: number) => `$${price.toLocaleString("es-AR")}`;

// Las fotos iniciales traen una franja de interfaz arriba que hay que recortar; las subidas desde el admin no.
export const cropClass = (image: string) => (image.startsWith("/uploads/") ? "" : "tile--crop");

export const seedSite: Site = {
  products,
  categories,
  collections: [{ slug: "drop-01", name: "Drop 01", image: categories[1].image }],
  settings: {
    promo: "Envíos a todo el país · 3 cuotas sin interés",
    heroImage,
    heroVideo: "",
    wheelEnabled: false,
    showRecentSales: true,
    heroTagline: "Nacido en la calle.\nHecho para marcar el tono.",
    manifestoTitle: "Vestí tu\nidentidad",
    manifestoText: "Negro sobre negro. Algodón pesado, cortes amplios y detalles mínimos, pensados para quienes hacen de la calle su uniforme.",
    lookbook: [editorialImage, categories[3].image, categories[2].image, categories[1].image, heroImage],
    whatsapp: "",
    instagram: "",
    email: "",
    spotify: "",
    dropTitle: "Próximo drop",
    dropDate: "",
    pickup: false,
    pickupNote: "",
    shippingDefault: 0,
    shippingZones: "",
    freeShippingFrom: 0,
    sizeGuide: "",
    // Valores de ejemplo para que la calculadora funcione de entrada; hay que reemplazarlos por las medidas reales de la marca.
    sizeRules: "S: 158-170 cm, 50-64 kg\nM: 166-178 cm, 62-76 kg\nL: 174-186 cm, 74-88 kg\nXL: 180-195 cm, 86-104 kg\n38: 158-170 cm, 50-64 kg\n40: 166-178 cm, 62-76 kg\n42: 174-186 cm, 74-88 kg\n44: 180-195 cm, 86-104 kg",
    outfitDiscount: 0,
    dropCollection: "",
    earlyCode: "",
    earlyMinutes: 60,
    aboutTitle: "Vestí tu identidad.",
    aboutText: "Indumentaria urbana en negro: algodón pesado, cortes amplios y detalles mínimos, hecha para la calle.",
    shippingText: "",
    termsText: "",
  },
  orders: [],
  coupons: [],
  subscribers: [],
  restock: [],
  community: [],
  looks: [],
};
