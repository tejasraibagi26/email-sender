import { Router } from 'express';
import { requireApiKey } from '../lib/auth.js';
import supabase from '../lib/supabase.js';
import { registerJob, deregisterJob } from '../lib/scheduler.js';
import { toCronExpression, computeNextRun } from '../lib/cronHelper.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /schedule — create a scheduled job
router.post('/', requireApiKey, async (req, res, next) => {
  try {
    const { name, appName, to, subject, html, body_text, text, cronExpression, frequency, time, day } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required', code: 'VALIDATION_ERROR' });
    if (!appName) return res.status(400).json({ error: 'appName is required', code: 'VALIDATION_ERROR' });
    if (!to || !EMAIL_RE.test(to)) return res.status(400).json({ error: 'Valid recipient email is required', code: 'VALIDATION_ERROR' });
    if (!subject) return res.status(400).json({ error: 'subject is required', code: 'VALIDATION_ERROR' });
    if (!html && !text && !body_text) return res.status(400).json({ error: 'At least one of html or text is required', code: 'VALIDATION_ERROR' });

    const bodyText = text || body_text;

    // Resolve cron expression from raw string or human-friendly input
    let resolvedCron;
    if (cronExpression) {
      resolvedCron = toCronExpression(cronExpression);
    } else if (frequency) {
      resolvedCron = toCronExpression({ frequency, time, day });
    } else {
      return res.status(400).json({ error: 'cronExpression or frequency is required', code: 'VALIDATION_ERROR' });
    }

    const nextRunAt = computeNextRun(resolvedCron);

    const { data: job, error } = await supabase
      .from('email_jobs')
      .insert({
        name,
        app_name: appName,
        recipient: to,
        subject,
        body_html: html || null,
        body_text: bodyText || null,
        cron_expression: resolvedCron,
        next_run_at: nextRunAt,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    registerJob(job);

    res.status(201).json({ success: true, data: { job } });
  } catch (err) {
    if (!err.status) err.status = 500;
    if (!err.code) err.code = 'INTERNAL_ERROR';
    next(err);
  }
});

// GET /schedule — list jobs
router.get('/', requireApiKey, async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase.from('email_jobs').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data: jobs, error } = await query;
    if (error) throw new Error(error.message);

    res.json({ success: true, data: { jobs } });
  } catch (err) {
    next(err);
  }
});

// DELETE /schedule/:id — cancel and delete a job
router.delete('/:id', requireApiKey, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_RE.test(id)) {
      return res.status(400).json({ error: 'Invalid job id', code: 'VALIDATION_ERROR' });
    }

    const { data: job, error: fetchErr } = await supabase
      .from('email_jobs')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchErr || !job) {
      return res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });
    }

    deregisterJob(id);

    const { error: delErr } = await supabase.from('email_jobs').delete().eq('id', id);
    if (delErr) throw new Error(delErr.message);

    res.json({ success: true, data: { message: 'Job deleted', id } });
  } catch (err) {
    next(err);
  }
});

export default router;
