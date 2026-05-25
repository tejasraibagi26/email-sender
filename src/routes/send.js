import { Router } from 'express';
import { requireApiKey } from '../lib/auth.js';
import { sendEmail } from '../lib/mailer.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', requireApiKey, async (req, res, next) => {
  try {
    const { to, subject, html, text, type } = req.body;

    if (!to || !EMAIL_RE.test(to)) {
      return res.status(400).json({ error: 'Valid recipient email is required', code: 'VALIDATION_ERROR' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'subject is required', code: 'VALIDATION_ERROR' });
    }
    if (!html && !text) {
      return res.status(400).json({ error: 'At least one of html or text is required', code: 'VALIDATION_ERROR' });
    }

    await sendEmail({ to, subject, html, text, type, jobId: null });

    res.json({ success: true, data: { message: 'Email sent', recipient: to } });
  } catch (err) {
    err.status = err.status || 502;
    err.code = err.code || 'SEND_FAILED';
    next(err);
  }
});

export default router;
