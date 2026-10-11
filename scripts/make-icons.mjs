import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

mkdirSync('public/icons', { recursive: true })
const wave = (inset) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#090d16"/>
<g transform="translate(${inset} ${inset}) scale(${(512 - 2 * inset) / 512})">
<path d="M64 272h112l40-112 64 208 48-136h120" fill="none" stroke="#06b6d4" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`

const jobs = [
  ['public/icons/icon-192.png', 192, 0],
  ['public/icons/icon-512.png', 512, 0],
  ['public/icons/icon-maskable-512.png', 512, 90],
]
for (const [file, size, inset] of jobs) {
  await sharp(Buffer.from(wave(inset)))
    .resize(size, size)
    .png()
    .toFile(file)
  console.log('wrote', file)
}
