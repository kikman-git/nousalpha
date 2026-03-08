import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export type ReportMeta = {
  company: string;
  signal: string;
  confidence: number;
  alphaReturn?: number;
  alphaProbability?: number;
  betaRisk?: number;
  betaProbability?: number;
  summary?: string;
};

// ── Colour palette (matches the app's dark theme) ────────────────
const C = {
  bg:        [5,   5,  16] as const,   // #050510
  surface:   [9,   9,  18] as const,   // slightly lighter
  border:    [39,  39,  42] as const,  // zinc-800
  text:      [244, 244, 245] as const, // zinc-100
  muted:     [113, 113, 122] as const, // zinc-500
  dim:       [63,  63,  70] as const,  // zinc-600
  emerald:   [16,  185, 129] as const, // emerald-500
  emeraldDim:[5,   46,  22] as const,  // emerald-950
  red:       [239, 68,  68] as const,  // red-500
  redDim:    [69,  10,  10] as const,  // red-950
  indigo:    [99,  102, 241] as const, // indigo-500
  amber:     [245, 158, 11] as const,  // amber-500
};

function hex(r: number, g: number, b: number) { return [r, g, b] as const; }
void hex; // suppress unused

// ── Drawing helpers ───────────────────────────────────────────────

function fillRect(
  pdf: jsPDF,
  x: number, y: number, w: number, h: number,
  [r, g, b]: readonly [number, number, number],
  radius = 0,
) {
  pdf.setFillColor(r, g, b);
  if (radius > 0) pdf.roundedRect(x, y, w, h, radius, radius, "F");
  else            pdf.rect(x, y, w, h, "F");
}

function strokeLine(
  pdf: jsPDF,
  x1: number, y1: number, x2: number, y2: number,
  [r, g, b]: readonly [number, number, number],
  lw = 0.2,
) {
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(lw);
  pdf.line(x1, y1, x2, y2);
}

function text(
  pdf: jsPDF,
  str: string,
  x: number, y: number,
  [r, g, b]: readonly [number, number, number],
  size: number,
  style: "normal" | "bold" = "normal",
  align: "left" | "center" | "right" = "left",
) {
  pdf.setTextColor(r, g, b);
  pdf.setFontSize(size);
  pdf.setFont("helvetica", style);
  pdf.text(str, x, y, { align });
}

// ── Page setup ────────────────────────────────────────────────────

function setupPage(pdf: jsPDF) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  fillRect(pdf, 0, 0, W, H, C.bg);
  return { W, H };
}

// ── Cover section ─────────────────────────────────────────────────

function drawCover(pdf: jsPDF, meta: ReportMeta) {
  const { W } = setupPage(pdf);

  // Accent bar
  fillRect(pdf, 0, 0, W, 2, C.emerald);

  // Brand
  const logoSize = 12;
  fillRect(pdf, 14, 8, logoSize, logoSize, C.emerald, 2);
  text(pdf, "JA", 20, 17, [0, 0, 0], 8, "bold", "center");
  text(pdf, "Origin", 30, 14, C.text, 16, "bold");
  text(pdf, "AI Hedge Fund Research", 30, 20, C.muted, 9);

  // Date (top right)
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  text(pdf, dateStr, W - 14, 14, C.muted, 8, "normal", "right");
  text(pdf, "Investment Analysis Report", W - 14, 20, C.dim, 7, "normal", "right");

  // Divider
  strokeLine(pdf, 14, 26, W - 14, 26, C.border, 0.3);

  // Company name
  text(pdf, meta.company, 14, 40, C.text, 22, "bold");

  // Signal chip
  const sigColor = meta.signal === "BUY" ? C.emerald : C.red;
  const sigBg = meta.signal === "BUY" ? C.emeraldDim : C.redDim;
  fillRect(pdf, 14, 44, 28, 8, sigBg, 2);
  text(pdf, meta.signal, 28, 50, sigColor, 10, "bold", "center");

  // Confidence bar
  const barX = 46;
  const barY = 46;
  const barW = 60;
  const barH = 4;
  fillRect(pdf, barX, barY, barW, barH, C.border, 1);
  fillRect(pdf, barX, barY, (barW * meta.confidence) / 100, barH, C.indigo, 1);
  text(pdf, `${meta.confidence}% confidence`, barX, 54, C.muted, 8);

  // Summary
  if (meta.summary) {
    const maxW = W - 28;
    const lines = pdf.splitTextToSize(meta.summary, maxW);
    text(pdf, "Judge's Summary", 14, 62, C.muted, 7, "bold");
    pdf.setTextColor(...C.text);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(lines.slice(0, 5), 14, 68); // cap at 5 lines
  }

  return 95; // y cursor after cover section
}

// ── Alpha / Beta summary boxes ────────────────────────────────────

function drawAlphaBetaBoxes(pdf: jsPDF, meta: ReportMeta, startY: number) {
  const { W } = { W: pdf.internal.pageSize.getWidth() };
  const colW = (W - 34) / 2;
  const boxH = 34;
  const y = startY;

  // Alpha box
  fillRect(pdf, 14, y, colW, boxH, C.emeraldDim, 3);
  strokeLine(pdf, 14, y, 14 + colW, y, C.emerald, 0.4);
  text(pdf, "α  Alpha · Bull Case", 20, y + 7, C.emerald, 9, "bold");
  if (meta.alphaProbability != null) {
    text(pdf, `${meta.alphaProbability}% probability`, 20, y + 14, C.muted, 8);
  }
  if (meta.alphaReturn != null) {
    text(pdf, `+${meta.alphaReturn}%`, 20, y + 24, C.emerald, 18, "bold");
    text(pdf, "expected return (3Y)", 20, y + 31, C.muted, 7);
  }

  // Beta box
  const bx = 14 + colW + 6;
  fillRect(pdf, bx, y, colW, boxH, C.redDim, 3);
  strokeLine(pdf, bx, y, bx + colW, y, C.red, 0.4);
  text(pdf, "β  Beta · Bear Case", bx + 6, y + 7, C.red, 9, "bold");
  if (meta.betaProbability != null) {
    text(pdf, `${meta.betaProbability}% probability`, bx + 6, y + 14, C.muted, 8);
  }
  if (meta.betaRisk != null) {
    const lossPct = Math.round(Math.min(meta.betaRisk, 0.7) * 100);
    text(pdf, `-${lossPct}%`, bx + 6, y + 24, C.red, 18, "bold");
    text(pdf, "potential downside (3Y)", bx + 6, y + 31, C.muted, 7);
  }

  return y + boxH + 8;
}

// ── Section heading ───────────────────────────────────────────────

function sectionHeading(pdf: jsPDF, label: string, y: number) {
  const W = pdf.internal.pageSize.getWidth();
  text(pdf, label, 14, y, C.muted, 7, "bold");
  strokeLine(pdf, 14, y + 2, W - 14, y + 2, C.border, 0.2);
  return y + 7;
}

// ── Captured content image (the live dashboard) ───────────────────

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    backgroundColor: "#050510",
    scale: 2,
    useCORS: true,
    logging: false,
    imageTimeout: 0,
  });
}

function addImageMultiPage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  startY: number,
) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const marginX = 14;
  const imgW = W - marginX * 2;
  const fullImgH = (canvas.height / canvas.width) * imgW;
  const pageContentH = H - startY - 14; // available on first page

  // If it fits on one page, just add it
  if (fullImgH <= pageContentH) {
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", marginX, startY, imgW, fullImgH);
    return;
  }

  // Otherwise split across pages
  const scale = canvas.width / imgW; // px per mm
  let srcYPx = 0;
  let firstPage = true;

  while (srcYPx < canvas.height) {
    const availH = firstPage ? pageContentH : H - 20;
    const sliceHPx = Math.min(availH * scale, canvas.height - srcYPx);

    // Slice the canvas
    const slice = document.createElement("canvas");
    slice.width  = canvas.width;
    slice.height = Math.ceil(sliceHPx);
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, -srcYPx);

    const sliceImgH = (slice.height / canvas.width) * imgW;
    const yPos = firstPage ? startY : 12;

    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", marginX, yPos, imgW, sliceImgH);

    srcYPx += sliceHPx;
    firstPage = false;

    if (srcYPx < canvas.height) {
      pdf.addPage();
      setupPage(pdf);
      // Accent bar on continuation pages
      fillRect(pdf, 0, 0, pdf.internal.pageSize.getWidth(), 1.5, C.emerald);
    }
  }
}

// ── Footer ────────────────────────────────────────────────────────

function drawFooter(pdf: jsPDF) {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const count = pdf.getNumberOfPages();

  for (let i = 1; i <= count; i++) {
    pdf.setPage(i);
    strokeLine(pdf, 14, H - 10, W - 14, H - 10, C.border, 0.2);
    text(pdf, "Origin · AI Hedge Fund Research · Confidential", W / 2, H - 6, C.dim, 7, "normal", "center");
    text(pdf, `${i} / ${count}`, W - 14, H - 6, C.dim, 7, "normal", "right");
  }
}

// ── Main export function ──────────────────────────────────────────

export async function exportReportPDF(
  dashboardEl: HTMLElement,
  meta: ReportMeta,
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Page 1: cover header + alpha/beta summary boxes
  let y = drawCover(pdf, meta);
  y = sectionHeading(pdf, "SCENARIO OVERVIEW", y);
  y = drawAlphaBetaBoxes(pdf, meta, y);
  y = sectionHeading(pdf, "DETAILED ANALYSIS", y);

  // Capture the rendered dashboard
  const canvas = await captureElement(dashboardEl);

  // Add it (multi-page if needed)
  addImageMultiPage(pdf, canvas, y);

  // Footers on all pages
  drawFooter(pdf);

  // Save
  const filename = `Origin_${meta.company.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}
