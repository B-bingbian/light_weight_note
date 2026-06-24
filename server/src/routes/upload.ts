import { Router, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest, ApiResponse } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UPLOADS_DIR = process.env.UPLOADS_PATH || path.join(__dirname, '..', '..', 'data', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-random.ext
    const ext = path.extname(file.originalname) || '.png';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 PNG / JPEG / GIF / WebP / SVG 图片格式'));
    }
  },
});

const router = Router();

// Require auth for uploads
router.use(authMiddleware);

// POST /api/upload — upload an image
router.post('/', (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const response: ApiResponse<never> = {
        success: false,
        error: err instanceof multer.MulterError ? '文件太大，最大 5MB' : err.message,
      };
      res.status(400).json(response);
      return;
    }

    if (!req.file) {
      const response: ApiResponse<never> = { success: false, error: '请选择图片文件' };
      res.status(400).json(response);
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    const response: ApiResponse<{ url: string }> = {
      success: true,
      data: { url },
    };
    res.json(response);
  });
});

export default router;
