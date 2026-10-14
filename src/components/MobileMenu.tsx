"use client";

import Link from "next/link";
import { useRef } from "react";

export default function MobileMenu({ links }: { links: { href: string; name: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  return (
    <>
      <button type="button" className="header-icon header-icon--menu" aria-label="Abrir menú" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <dialog ref={dialog} className="mobile-menu" aria-label="Menú" onClick={(event) => { if (event.target === dialog.current) close(); }}>
        <div className="mobile-menu__panel">
          <button type="button" className="header-icon" aria-label="Cerrar menú" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <nav aria-label="Principal">
            {links.map((link) => <Link href={link.href} onClick={close} key={link.href}>{link.name}</Link>)}
          </nav>
        </div>
      </dialog>
    </>
  );
}
