# Deploying to Render

This project deploys as **one single Render Web Service** — it builds the
React frontend into static files, and the same Express backend that serves
your `/api/*` routes also serves those static files. One service, one URL,
no CORS, no cross-domain cookie issues.

## Option A — Blueprint (fastest)

1. Push this code to a GitHub repo (if you haven't already).
2. Go to https://dashboard.render.com → **New** → **Blueprint**.
3. Connect your repo. Render will detect `render.yaml` automatically and
   create the web service for you.
4. It will ask you to fill in the env vars marked `sync: false` — see the
   list below.
5. Click **Apply** / **Create**.

## Option B — Manual Web Service

1. Go to https://dashboard.render.com → **New** → **Web Service**.
2. Connect your GitHub repo.
3. Settings:
   - **Root Directory:** leave blank (repo root)
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or paid, your choice)
4. Add the environment variables below.
5. Click **Create Web Service**.

## Environment variables to set

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | A long random string |
| `JWT_REFRESH_SECRET` | A different long random string |
| `COOKIE_SECRET` | A long random string |
| `OWNER_EMAIL` | Your admin login email |
| `OWNER_PASSWORD` | A real password (not a placeholder) |
| `CLIENT_URL` | Your Render URL once known, e.g. `https://selvam-maligai-store.onrender.com` — you can leave this blank for the first deploy and add it after Render assigns your URL, then redeploy |

Generate random secrets locally with:
```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## MongoDB Atlas — allow Render's IPs

Render's outbound IPs aren't fixed on the free tier, so in Atlas →
**Network Access**, add `0.0.0.0/0` (allow from anywhere). Your connection
is still protected by the username/password in `MONGODB_URI`.

## After deploying

Visit your Render URL — it should show your storefront homepage. Try
logging in as the owner using `OWNER_EMAIL` / `OWNER_PASSWORD`. If it
doesn't work, check **Render Dashboard → your service → Logs** — errors
will show up there directly (the app logs to console in production, which
Render captures automatically).

## Notes

- Render's free tier spins the service down after inactivity — the first
  request after idle time can take ~30–60 seconds while it wakes back up.
  This is normal, not a bug.
- This project no longer uses Vercel — the old `vercel.json` files and the
  `backend/api/` serverless wrapper have been removed since Render runs
  this as a regular persistent Node process instead.
