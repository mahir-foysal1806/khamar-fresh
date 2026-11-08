import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// NOTE: local disk is fine for a VPS. On ephemeral hosts (Render/Heroku) swap this
// storage for Cloudinary/S3 — only this file needs to change.
export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype) ? cb(null, true) : cb(new Error('Only image files are allowed'))),
});
