function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildCsv(header: string[], rows: string[][]) {
  const csvLines = [
    header.map((value) => escapeCsvCell(value)).join(","),
    ...rows.map((row) => row.map((value) => escapeCsvCell(value)).join(",")),
  ];

  return `\uFEFF${csvLines.join("\n")}`;
}
