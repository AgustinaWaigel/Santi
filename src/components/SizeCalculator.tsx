"use client";

import { useState } from "react";
import { recommendSize, type Fit } from "@/lib/pricing";

const FITS: { value: Fit; label: string }[] = [{ value: "justo", label: "Al cuerpo" }, { value: "normal", label: "Normal" }, { value: "oversize", label: "Oversize" }];

export default function SizeCalculator({ rules, sizes, stock, onPick }: { rules: string; sizes: string[]; stock: Record<string, number>; onPick: (size: string) => void }) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fit, setFit] = useState<Fit>("normal");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  function calculate() {
    const cm = Number(height);
    const kg = Number(weight);
    if (!(cm >= 120 && cm <= 230) || !(kg >= 30 && kg <= 250)) {
      setResult(null);
      return setError("Ingresá tu altura en centímetros y tu peso en kilos.");
    }
    setError("");
    setResult(recommendSize(rules, sizes, cm, kg, fit));
  }

  const available = result !== null && (stock[result] ?? 0) > 0;
  return (
    <details className="size-guide size-calc">
      <summary><span>¿No sabés tu talle?</span> Calculalo →</summary>
      <div className="size-calc__body">
        <label className="field"><span>Altura (cm)</span><input type="number" inputMode="numeric" min="120" max="230" value={height} onChange={(event) => setHeight(event.target.value)} /></label>
        <label className="field"><span>Peso (kg)</span><input type="number" inputMode="numeric" min="30" max="250" value={weight} onChange={(event) => setWeight(event.target.value)} /></label>
        <div className="chip-row size-calc__fits" role="radiogroup" aria-label="Cómo te gusta que te quede">
          {FITS.map((option) => <button type="button" role="radio" aria-checked={fit === option.value} className={`chip ${fit === option.value ? "chip--active" : ""}`} onClick={() => setFit(option.value)} key={option.value}>{option.label}</button>)}
        </div>
        <button type="button" className="btn btn--ghost" onClick={calculate}>Calcular</button>
        <p className="size-calc__result" role="status">
          {error}
          {result !== null && <>Tu talle es <strong>{result}</strong>. {available ? <button type="button" className="admin-link" onClick={() => onPick(result)}>Elegir {result}</button> : "Ahora no hay stock de ese talle."}</>}
        </p>
        <p className="form-note">Es una orientación según altura y peso; si estás entre dos talles, mirá la guía de talles.</p>
      </div>
    </details>
  );
}
