import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveToDisk, now } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest, User, ApiResponse } from '../types.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'notes-app-secret-change-in-production';

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper: map a row array to a User object
// Column order: id, username, created_at
function rowToUser(row: unknown[]): User {
  return {
    id: row[0] as number,
    username: row[1] as string,
    created_at: row[2] as string,
  };
}

// POST /api/auth/register
router.post('/register', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { username, password } = req.body;

    if (!username || !password) {
      const response: ApiResponse<never> = { success: false, error: '用户名和密码不能为空' };
      res.status(400).json(response);
      return;
    }

    if (typeof username !== 'string' || username.trim().length < 2) {
      const response: ApiResponse<never> = { success: false, error: '用户名至少 2 个字符' };
      res.status(400).json(response);
      return;
    }

    if (typeof password !== 'string' || password.length < 4) {
      const response: ApiResponse<never> = { success: false, error: '密码至少 4 个字符' };
      res.status(400).json(response);
      return;
    }

    // Check if username already exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    checkStmt.bind([username.trim()]);
    if (checkStmt.step()) {
      checkStmt.free();
      const response: ApiResponse<never> = { success: false, error: '用户名已存在' };
      res.status(409).json(response);
      return;
    }
    checkStmt.free();

    // Hash password and create user
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)', [username.trim(), hashedPassword, now()]);

    // Must get last_insert_rowid BEFORE saveToDisk (export resets it)
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = idResult[0].values[0][0] as number;
    saveToDisk();

    // Fetch the created user
    const stmt = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
    stmt.bind([newId]);
    stmt.step();
    const user = rowToUser(stmt.get());
    stmt.free();

    const token = generateToken(user.id);
    const response: ApiResponse<{ token: string; user: User }> = {
      success: true,
      data: { token, user },
    };
    res.status(201).json(response);
  } catch (err) {
    const response: ApiResponse<never> = {
      success: false,
      error: err instanceof Error ? err.message : '注册失败',
    };
    res.status(500).json(response);
  }
});

// POST /api/auth/login
router.post('/login', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { username, password } = req.body;

    if (!username || !password) {
      const response: ApiResponse<never> = { success: false, error: '用户名和密码不能为空' };
      res.status(400).json(response);
      return;
    }

    // Find user (column order: id, username, password, created_at)
    const stmt = db.prepare('SELECT id, username, password, created_at FROM users WHERE username = ?');
    stmt.bind([username]);
    let row: unknown[] | null = null;
    if (stmt.step()) {
      row = stmt.get();
    }
    stmt.free();

    if (!row) {
      const response: ApiResponse<never> = { success: false, error: '用户名或密码错误' };
      res.status(401).json(response);
      return;
    }

    // Verify password (index 2 = password)
    const valid = bcrypt.compareSync(password as string, row[2] as string);
    if (!valid) {
      const response: ApiResponse<never> = { success: false, error: '用户名或密码错误' };
      res.status(401).json(response);
      return;
    }

    const user: User = {
      id: row[0] as number,
      username: row[1] as string,
      created_at: row[3] as string,
    };

    const token = generateToken(user.id);
    const response: ApiResponse<{ token: string; user: User }> = {
      success: true,
      data: { token, user },
    };
    res.json(response);
  } catch (err) {
    const response: ApiResponse<never> = {
      success: false,
      error: err instanceof Error ? err.message : '登录失败',
    };
    res.status(500).json(response);
  }
});

// GET /api/auth/me — get current user info
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
    stmt.bind([req.userId!]);
    let user: User | null = null;
    if (stmt.step()) {
      user = rowToUser(stmt.get());
    }
    stmt.free();

    if (!user) {
      const response: ApiResponse<never> = { success: false, error: '用户不存在' };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ user: User }> = { success: true, data: { user } };
    res.json(response);
  } catch (err) {
    const response: ApiResponse<never> = {
      success: false,
      error: err instanceof Error ? err.message : '获取用户信息失败',
    };
    res.status(500).json(response);
  }
});

export default router;
