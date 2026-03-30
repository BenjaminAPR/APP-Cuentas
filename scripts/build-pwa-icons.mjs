/**
 * Genera iconos PWA desde una foto cuadrada (o cualquier ratio → recorte centrado).
 * Uso: node scripts/build-pwa-icons.mjs [ruta-imagen]
 * Por defecto: public/_icon_temp.png
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const defInput = path.join(root, "public", "_icon_temp.png");
const input = process.argv[2] ? path.resolve(process.argv[2]) : defInput;
const outDir = path.join(root, "public");

if (!fs.existsSync(input)) {
  console.error("No existe la imagen:", input);
  process.exit(1);
}

const sizes = [
  ["icon-512.png", 512],
  ["icon-192.png", 192],
  ["apple-touch-icon.png", 180],
];

// position attention = intenta enfocar la zona con más detalle (caras suelen salir mejor)
for (const [filename, size] of sizes) {
  const dest = path.join(outDir, filename);
  await sharp(input)
    .rotate()
    .resize(size, size, {
      fit: "cover",
      position: "attention",
    })
    .png({ compressionLevel: 9 })
    .toFile(dest);
  console.log("OK", filename, size);
}
