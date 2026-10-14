"use client";

export default function DeleteButton({ name }: { name: string }) {
  return (
    <button type="submit" className="admin-link admin-link--danger" onClick={(event) => { if (!window.confirm(`¿Borrar "${name}"? No se puede deshacer.`)) event.preventDefault(); }}>Borrar</button>
  );
}
