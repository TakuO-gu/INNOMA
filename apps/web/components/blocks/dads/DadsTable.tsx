import React from "react";

export function DadsTable({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[];
}) {
  // DADS compliant table without outer border
  return (
    <table className="dads-table">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="dads-table__row">
            <th scope="row" className="dads-table__header">{r.label}</th>
            <td className="dads-table__cell">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
