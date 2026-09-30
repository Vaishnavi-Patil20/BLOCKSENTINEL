function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[\r\n]/g, " ");
}

function wrap(text: string, maxChars = 92) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) current = word;
    else if (`${current} ${word}`.length <= maxChars) current += ` ${word}`;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function downloadCasePdf(
  title: string,
  sections: { heading: string; lines: string[] }[],
  filename: string,
) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 42;
  const lineHeight = 14;
  const bottom = 44;
  const pages: { text: string; bold: boolean; y: number }[][] = [];
  let current: { text: string; bold: boolean; y: number }[] = [];
  let y = pageHeight - margin;

  const line = (text: string, bold = false, gap = 0) => {
    if (y < bottom + lineHeight) {
      pages.push(current);
      current = [];
      y = pageHeight - margin;
    }
    current.push({ text, bold, y });
    y -= lineHeight + gap;
  };

  line("BlockSentinel Investigation Report", true, 2);
  line(new Date().toISOString());
  line(title, true, 8);
  for (const section of sections) {
    line(section.heading, true, 1);
    for (const item of section.lines) {
      for (const wrapped of wrap(item)) line(wrapped);
    }
    y -= 6;
  }
  if (current.length || !pages.length) pages.push(current);

  // PDF object layout: 1 Catalog, 2 Pages, 3/4 fonts, then page/content pairs.
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>"); // 1
  objects.push(""); // 2 placeholder for Pages
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"); // 3
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"); // 4

  const pageRefs: string[] = [];
  pages.forEach((page) => {
    const pageObj = objects.length + 1;
    const contentObj = pageObj + 1;
    const stream = ["BT", ...page.map((item) => `${item.bold ? "/F2" : "/F1"} 10 Tf 1 0 0 1 ${margin} ${item.y} Tm (${pdfEscape(item.text)}) Tj`), "ET"].join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageRefs.push(`${pageObj} 0 R`);
  });
  objects[1] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((body, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
