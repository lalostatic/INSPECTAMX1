import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = "/workspace/propuesta";
const out = "/workspace/artifacts/propuesta";
await mkdir(out, { recursive: true });

const footer = `
  <div style="font-size:8px;width:100%;padding:0 16mm;color:#5b6b75;display:flex;justify-content:space-between;font-family:Arial,sans-serif;">
    <span>INSPECTA · confidencial</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

const jobs = [
  { file: "cotizacion.html", pdf: "COT-INSPECTA-001-Cotizacion.pdf" },
  { file: "contrato.html", pdf: "Contrato-INSPECTA.pdf" },
];

const browser = await chromium.launch();
for (const job of jobs) {
  const page = await browser.newPage();
  await page.goto("file://" + path.join(root, job.file), { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));
  });
  await page.waitForTimeout(300);
  await page.pdf({
    path: path.join(out, job.pdf),
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: footer,
    margin: { top: "12mm", bottom: "15mm", left: "14mm", right: "14mm" },
  });
  console.log("wrote", job.pdf);
  await page.close();
}
await browser.close();
