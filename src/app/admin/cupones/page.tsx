import { redirect } from "next/navigation";
import CouponForm from "@/components/admin/CouponForm";
import DeleteButton from "@/components/admin/DeleteButton";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";
import { deleteCoupon } from "../actions";

export default async function AdminCouponsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const { coupons } = await getSite();
  return (
    <main className="admin">
      <p className="eyebrow">Admin / {String(coupons.length).padStart(2, "0")}</p>
      <h1>Descuentos</h1>
      {coupons.length > 0 && (
        <ul className="admin-list">
          {coupons.map((coupon) => (
            <li className="admin-row admin-row--plain" key={coupon.code}>
              <div className="admin-row__info"><strong>{coupon.code}</strong><span>{coupon.percent}% de descuento{coupon.wheel ? " · premio de la ruleta" : ""}</span></div>
              <form action={deleteCoupon}><input type="hidden" name="code" value={coupon.code} /><DeleteButton name={coupon.code} /></form>
            </li>
          ))}
        </ul>
      )}
      <h2>Nuevo código</h2>
      <CouponForm />
    </main>
  );
}
