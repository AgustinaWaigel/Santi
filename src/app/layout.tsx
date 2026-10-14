import CartDrawer from "@/components/CartDrawer"
import DropMode from "@/components/DropMode"
import SalesToast from "@/components/SalesToast"
import Wheel from "@/components/Wheel"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import type { Metadata } from "next"
import { Archivo, Bowlby_One, Geist_Mono } from "next/font/google"
import { siteUrl } from "@/lib/mercadopago"
import { getSite } from "@/lib/store"
import "./globals.css"

const display = Bowlby_One({ weight: "400", subsets: ["latin"], variable: "--font-display" })
const body = Archivo({ subsets: ["latin"], variable: "--font-body" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const description = "Indumentaria urbana en negro. Streetwear hecho para la calle."

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSite()
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: "Blackfit — Streetwear", template: "%s — Blackfit" },
    description,
    // Vista previa al compartir un enlace en WhatsApp, Instagram y demás.
    openGraph: { siteName: "Blackfit", type: "website", locale: "es_AR", description, images: [settings.heroImage] },
    twitter: { card: "summary_large_image" },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { products, settings, orders, coupons } = await getSite()
  // Para el cartel de compras recientes solo salen del servidor la ciudad (si parece un nombre de lugar) y la prenda.
  const city = (value: string) => (/^[\p{L} .'-]{2,30}$/u.test(value.trim()) ? value.trim() : "")
  const sales = settings.showRecentSales ? orders.filter((order) => order.status !== "cancelado" && order.items.length > 0).slice(0, 5).map((order) => ({ city: city(order.customer.city), name: order.items[0].name, at: order.createdAt })) : []
  const prizes = settings.wheelEnabled ? coupons.filter((coupon) => coupon.wheel).map((coupon) => coupon.percent) : []
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        {/* Telón de entrada con el logo: una vez por visita, y se decide antes del primer pintado para que no parpadee. */}
        <script dangerouslySetInnerHTML={{ __html: 'try{if(sessionStorage.getItem("bf-intro"))document.documentElement.dataset.intro="seen";else sessionStorage.setItem("bf-intro","1")}catch(e){}' }} />
        <div className="intro" aria-hidden="true"><span>B.</span></div>
        {settings.dropDate && <DropMode title={settings.dropTitle} date={settings.dropDate} />}
        <noscript><style>{".reveal, .reveal-stagger > * { opacity: 1 !important; transform: none !important; }"}</style></noscript>
        <Header />
        {children}
        <Footer />
        <SalesToast sales={sales} />
        {prizes.length > 0 && <Wheel percents={prizes} />}
        <CartDrawer products={products.map(({ slug, name, price, images, stock }) => ({ slug, name, price, images: images.slice(0, 1), stock }))} freeShippingFrom={settings.freeShippingFrom} />
      </body>
    </html>
  )
}
