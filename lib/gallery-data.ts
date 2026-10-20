import * as fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')

export const GALLERY_FILE = path.join(DATA_DIR, 'gallery.json')

export async function readGallery(): Promise<any[]> {
  try {
    const raw = await fs.readFile(GALLERY_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function writeGallery(data: any[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const tmp = `${GALLERY_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tmp, GALLERY_FILE)
}
