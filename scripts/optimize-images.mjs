/**
 * Converts every PNG/JPG in public/home, public/products, public/lifestyle and public/brand to WebP
 * (max 1600px wide, quality 80) alongside the original. Components reference
 * the .webp files; drop a new PNG with the same name and re-run:
 *
 *   npm run images:optimize
 */
import { readdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

const DIRS = ["public/home", "public/products", "public/lifestyle", "public/brand", "ads-crea/statics"];
const MAX_WIDTH = 1600;

for (const dir of DIRS) {
  let files;
  try {
    files = await readdir(dir);
  } catch {
    continue;
  }
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) continue;

    const src = join(dir, file);
    const out = join(dir, `${basename(file, ext)}.webp`);
    const before = (await stat(src)).size;

    await sharp(src)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(out);

    const after = (await stat(out)).size;
    console.log(
      `${src} → ${out}  ${(before / 1024).toFixed(0)} Ko → ${(after / 1024).toFixed(0)} Ko`,
    );
  }
}
console.log("✓ Optimisation terminée.");
