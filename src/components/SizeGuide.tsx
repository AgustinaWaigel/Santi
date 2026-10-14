// Tabla de medidas cargada desde el admin: una fila por línea, columnas separadas por "|".
export default function SizeGuide({ text }: { text: string }) {
  const rows = text.split("\n").map((line) => line.split("|").map((cell) => cell.trim())).filter((row) => row.some(Boolean));
  if (rows.length < 2) return null;
  const [head, ...body] = rows;
  return (
    <details className="size-guide">
      <summary>Guía de talles</summary>
      <table>
        <thead><tr>{head.map((cell, index) => <th scope="col" key={index}>{cell}</th>)}</tr></thead>
        <tbody>{body.map((row, index) => <tr key={index}>{head.map((_, column) => (column === 0 ? <th scope="row" key={column}>{row[column]}</th> : <td key={column}>{row[column]}</td>))}</tr>)}</tbody>
      </table>
    </details>
  );
}
