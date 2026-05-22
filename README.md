# email-service

Standalone internal email gateway. Sends from a Gmail account via App Password (SMTP). Supports immediate sends and cron-scheduled recurring emails. All jobs persist in Supabase.

## Setup

### 1. Gmail App Password

1. Sign in to your Google Account
2. Go to **Security → 2-Step Verification → App Passwords**
3. Generate a new app password for **Mail**
4. Copy the 16-character password

### 2. Supabase — run the migration

In the Supabase dashboard SQL editor, run the contents of `migrations/001_initial.sql`.

### 3. Environment

```bash
cp .env.example .env
```

Fill in all values:

| Variable | Description |
|---|---|
| `API_KEY` | Secret for callers — generate with `node -e "import('crypto').then(c => console.log(c.randomBytes(32).toString('hex')))"` |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | 16-char app password from step 1 |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `PORT` | Port (default: 3002) |

### 4. Run

```bash
npm install
npm run dev      # development (nodemon)
npm start        # production
```

---

## API

All endpoints except `/health` require:

```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

### `GET /health`

```bash
curl http://localhost:3002/health
```

### `POST /send` — immediate send

```bash
curl -X POST http://localhost:3002/send \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"to":"recipient@example.com","subject":"Hello","text":"Plain text","html":"<p>Or HTML</p>"}'
```

Body fields:

| Field | Required | Description |
|---|---|---|
| `to` | yes | Recipient email |
| `subject` | yes | Email subject |
| `html` | one of | HTML body |
| `text` | one of | Plain-text body |

### `POST /jobs` — create a scheduled job

**Human-friendly frequency:**

```bash
curl -X POST http://localhost:3002/jobs \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily standup",
    "to": "team@example.com",
    "subject": "Daily reminder",
    "html": "<p>Time for standup!</p>",
    "frequency": "daily",
    "time": "09:00"
  }'
```

**Raw cron expression:**

```bash
-d '{
  "name": "Weekly digest",
  "to": "me@example.com",
  "subject": "Weekly digest",
  "text": "Your weekly summary",
  "cronExpression": "0 12 * * 1"
}'
```

Supported frequencies:

| frequency | extra fields | example cron |
|---|---|---|
| `hourly` | — | `0 * * * *` |
| `daily` | `time` | `0 9 * * *` |
| `weekly` | `time`, `day` | `0 12 * * 1` |
| `weekdays` | `time` | `0 8 * * 1-5` |
| `monthly` | `time`, `day` (1–28) | `0 7 1 * *` |

### `GET /jobs` — list jobs

```bash
curl http://localhost:3002/jobs \
  -H "Authorization: Bearer <API_KEY>"

# Filter by status
curl "http://localhost:3002/jobs?status=active" \
  -H "Authorization: Bearer <API_KEY>"
```

### `DELETE /jobs/:id` — cancel a job

```bash
curl -X DELETE http://localhost:3002/jobs/<uuid> \
  -H "Authorization: Bearer <API_KEY>"
```

---

## Calling from another service

```js
const res = await fetch('http://localhost:3002/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.EMAIL_SERVICE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Price alert',
    html: '<p>Your stock hit the target price.</p>',
  }),
});
const data = await res.json();
```

Add `EMAIL_SERVICE_API_KEY` and `EMAIL_SERVICE_URL` to the calling app's `.env`.

---

## Notes

- **Missed runs**: if the service is down when a job was supposed to fire, that run is silently skipped (better than double-sending on restart).
- **Audit log**: every send attempt (success or failure) is recorded in `email_logs`.
- **HTML + text**: if both are provided, email clients show HTML with text as fallback.
