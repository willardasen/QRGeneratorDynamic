import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "printed_qrcodes.json");

function ensureStoreFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify([]), "utf8");
    }
  } catch {
    // Read-only filesystem on serverless platforms (e.g. Vercel); safe to ignore
  }
}

/**
 * Returns a Set of QR Code IDs that have been marked as printed/used in the field.
 */
export function getPrintedIds(): Set<string> {
  try {
    ensureStoreFile();
    const data = fs.readFileSync(STORE_FILE, "utf8");
    const arr = JSON.parse(data);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (err) {
    console.error("Failed to read printed qrcodes store:", err);
    return new Set();
  }
}

/**
 * Sets the printed status for a list of QR Code IDs.
 */
export function setPrintedStatus(ids: string[], isPrinted: boolean): boolean {
  try {
    ensureStoreFile();
    const current = getPrintedIds();
    for (const id of ids) {
      if (isPrinted) {
        current.add(id);
      } else {
        current.delete(id);
      }
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(Array.from(current)), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write printed qrcodes store:", err);
    return false;
  }
}

/**
 * Removes QR Code IDs from the printed store upon deletion.
 */
export function removePrintedIds(ids: string[]): void {
  try {
    ensureStoreFile();
    const current = getPrintedIds();
    for (const id of ids) {
      current.delete(id);
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(Array.from(current)), "utf8");
  } catch (err) {
    console.error("Failed to remove printed qrcodes:", err);
  }
}
