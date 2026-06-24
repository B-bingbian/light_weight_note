import { Router, type Response } from 'express';
import { getDb, saveToDisk, now } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import type { Note, NoteInput, ApiResponse, AuthRequest } from '../types.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Helper: map a row array to a Note object
// Column order (SELECT *): id, title, content, user_id, created_at, updated_at
function rowToNote(row: unknown[]): Note {
  return {
    id: row[0] as number,
    title: row[1] as string,
    content: row[2] as string,
    user_id: row[3] as number,
    created_at: row[4] as string,
    updated_at: row[5] as string,
  };
}

// GET /api/notes — list notes, optional ?search=
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { search } = req.query;
    const userId = req.userId!;

    let notes: Note[];
    if (search && typeof search === 'string') {
      const stmt = db.prepare(
        'SELECT * FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC'
      );
      const pattern = `%${search}%`;
      stmt.bind([userId, pattern, pattern]);
      notes = [];
      while (stmt.step()) {
        notes.push(rowToNote(stmt.get()));
      }
      stmt.free();
    } else {
      const stmt = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC');
      stmt.bind([userId]);
      notes = [];
      while (stmt.step()) {
        notes.push(rowToNote(stmt.get()));
      }
      stmt.free();
    }

    const response: ApiResponse<{ notes: Note[] }> = {
      success: true,
      data: { notes },
    };
    res.json(response);
  } catch (err) {
    const response: ApiResponse<never> = {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch notes',
    };
    res.status(500).json(response);
  }
});

// GET /api/notes/:id — get single note
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const stmt = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?');
    stmt.bind([Number(req.params.id), userId]);

    let note: Note | null = null;
    if (stmt.step()) {
      note = rowToNote(stmt.get());
    }
    stmt.free();

    if (!note) {
      const response: ApiResponse<never> = { success: false, error: 'Note not found' };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ note: Note }> = { success: true, data: { note } };
    res.json(response);
  } catch (err) {
    const response: ApiResponse<never> = {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch note',
    };
    res.status(500).json(response);
  }
});

// POST /api/notes — create new note
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const { title, content } = req.body as NoteInput;

    const ts = now();
    db.run('INSERT INTO notes (title, content, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
      title || 'Untitled',
      content || '',
      userId,
      ts,
      ts,
    ]);

    // Must get last_insert_rowid BEFORE saveToDisk (export resets it)
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = idResult[0].values[0][0] as number;

    saveToDisk();

    // Fetch the created note
    const stmt = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?');
    stmt.bind([newId, userId]);
    stmt.step();
    const note = rowToNote(stmt.get());
    stmt.free();

    const response: ApiResponse<{ note: Note }> = { success: true, data: { note } };
    res.status(201).json(response);
  } catch (err) {
    const response: ApiResponse<never> = {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create note',
    };
    res.status(500).json(response);
  }
});

// PUT /api/notes/:id — update note
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const id = Number(req.params.id);

    // Check ownership
    const checkStmt = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
    checkStmt.bind([id, userId]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (!exists) {
      const response: ApiResponse<never> = { success: false, error: 'Note not found' };
      res.status(404).json(response);
      return;
    }

    const { title, content } = req.body as NoteInput;
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }

    if (updates.length > 0) {
      // Always update updated_at
      updates.push('updated_at = ?');
      values.push(now());
      values.push(id);
      values.push(userId);
      db.run(`UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values);
      saveToDisk();
    }

    // Fetch updated note
    const stmt = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?');
    stmt.bind([id, userId]);
    stmt.step();
    const note = rowToNote(stmt.get());
    stmt.free();

    const response: ApiResponse<{ note: Note }> = { success: true, data: { note } };
    res.json(response);
  } catch (err) {
    const response: ApiResponse<never> = {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update note',
    };
    res.status(500).json(response);
  }
});

// DELETE /api/notes/:id — delete note
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const id = Number(req.params.id);

    // Check ownership
    const checkStmt = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
    checkStmt.bind([id, userId]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (!exists) {
      const response: ApiResponse<never> = { success: false, error: 'Note not found' };
      res.status(404).json(response);
      return;
    }

    db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    saveToDisk();

    res.status(204).send();
  } catch (err) {
    const response: ApiResponse<never> = {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete note',
    };
    res.status(500).json(response);
  }
});

export default router;
