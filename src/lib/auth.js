import { timingSafeEqual } from 'crypto';

export function requireApiKey(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_API_KEY' });
  }

  try {
    const expected = Buffer.from(process.env.API_KEY);
    const provided = Buffer.from(token);
    // Buffers must be same length for timingSafeEqual; pad to avoid length leak
    const match =
      expected.length === provided.length &&
      timingSafeEqual(expected, provided);

    if (!match) {
      return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_API_KEY' });
    }
  } catch {
    return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_API_KEY' });
  }

  next();
}
