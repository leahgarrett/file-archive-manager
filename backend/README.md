# Backend

Minimal Express server to serve and update sample JSON used in the frontend tests.

Run locally:

```bash
# from repo root
cd backend
npm install
npm run dev
```

API

- GET /api/photos/data -> returns JSON array
- POST /api/photos/data -> accepts JSON array and writes to disk (atomic)
