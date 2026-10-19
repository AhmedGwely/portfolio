import * as fs from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')

/**
 * Ensure the data directory exists.
 */
async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

/**
 * Sanitize a filename: only allow alphanumeric chars, dashes, and underscores.
 * Throws if the filename contains anything else or is empty.
 */
function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename: must be a non-empty string')
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
    throw new Error('Invalid filename: only alphanumeric, dash, and underscore allowed')
  }
  return filename
}

/**
 * Get the full file path for a given filename.
 */
function getFilePath(filename: string): string {
  return path.join(DATA_DIR, `${sanitizeFilename(filename)}.json`)
}

/**
 * Read JSON data from the data directory.
 * Returns defaultValue if the file doesn't exist.
 */
export async function readData<T>(filename: string, defaultValue: T): Promise<T> {
  const filePath = getFilePath(filename)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultValue
    }
    throw err
  }
}

/**
 * Write JSON data to the data directory using atomic write (tmp file + rename).
 */
export async function writeData<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir()
  const filePath = getFilePath(filename)
  const tmpPath = `${filePath}.tmp`
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tmpPath, filePath)
}
