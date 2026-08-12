'use strict';

/**
 * One-time cleanup: shrinks base64 product images already stored in MongoDB.
 *
 * New uploads are compressed client-side (see ProductManager.jsx), but
 * products added before that change may still have full-size photos (several
 * MB each) embedded directly in their documents. That bloat is what caused
 * GET /api/products to exceed MongoDB's 32MB in-memory sort limit, and it
 * also eats into your Atlas storage quota.
 *
 * This script re-encodes every oversized image to a resized, compressed
 * JPEG and writes it back — nothing else about the product changes.
 *
 * Run it once, from the backend/ folder, wherever MONGODB_URI points at your
 * real database (e.g. Render's Shell tab, or locally with your .env set):
 *
 *   npm run compress-images
 *
 * It's safe to re-run: images already small enough are skipped.
 */

const sharp = require('sharp');
const db = require('../src/config/db');
const Product = require('../src/models/Product');

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 72;
// Anything already smaller than this is left alone — re-compressing it
// again would risk making it look worse for basically no size savings.
const SKIP_IF_UNDER_BYTES = 100 * 1024; // 100KB

function base64Size(dataUri) {
  const commaIndex = dataUri.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUri.slice(commaIndex + 1) : dataUri;
  return Math.round((base64.length * 3) / 4);
}

async function compressOne(doc) {
  const original = doc.image;
  const originalBytes = base64Size(original);

  if (originalBytes <= SKIP_IF_UNDER_BYTES) {
    return { skipped: true };
  }

  const commaIndex = original.indexOf(',');
  const base64Data = commaIndex >= 0 ? original.slice(commaIndex + 1) : original;
  const inputBuffer = Buffer.from(base64Data, 'base64');

  const outputBuffer = await sharp(inputBuffer)
    .rotate() // respects EXIF orientation before resizing
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  const newDataUri = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
  const newBytes = outputBuffer.length;

  // Only write back if we actually saved meaningful space.
  if (newBytes >= originalBytes) {
    return { skipped: true };
  }

  await Product.updateOne({ _id: doc._id }, { $set: { image: newDataUri } });

  return { skipped: false, originalBytes, newBytes };
}

async function main() {
  console.log('Connecting to database...');
  await db.connect();

  const products = await Product.find({
    image: { $regex: '^data:image' },
  }).select('_id name image');

  console.log(`Found ${products.length} product(s) with an embedded image.`);

  let processed = 0;
  let skipped = 0;
  let totalBefore = 0;
  let totalAfter = 0;
  let failed = 0;

  for (const doc of products) {
    try {
      const result = await compressOne(doc);
      if (result.skipped) {
        skipped += 1;
        continue;
      }
      processed += 1;
      totalBefore += result.originalBytes;
      totalAfter += result.newBytes;
      console.log(
        `  compressed "${doc.name}": ${(result.originalBytes / 1024).toFixed(0)}KB -> ${(result.newBytes / 1024).toFixed(0)}KB`
      );
    } catch (err) {
      failed += 1;
      console.error(`  FAILED on "${doc.name}" (${doc._id}):`, err.message);
    }
  }

  console.log('\nDone.');
  console.log(`  Compressed: ${processed}`);
  console.log(`  Skipped (already small enough): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  if (processed > 0) {
    const savedMb = (totalBefore - totalAfter) / (1024 * 1024);
    console.log(`  Space saved: ~${savedMb.toFixed(2)}MB`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
