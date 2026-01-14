import React from "react";

export function DadsTable({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[];
}) {
  // DADS仕様：.dads-table + data-border 等（必要に応じて data-cell-border も）
  return (
    <table className="dads-table" data-border>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <th scope="row">{r.label}</th>
            <td>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
