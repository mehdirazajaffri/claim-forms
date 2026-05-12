## Plan: Deploy on Vercel with Free DB

For Vercel, local SQLite is not a good production choice because serverless file systems are ephemeral/read-only for reliable writes.  
Best concrete path: keep your app as-is and switch DB to **Neon Postgres free tier** (easiest with Prisma).

### 1. Prepare DB (Neon free)
1. Create a Neon account and new project.
2. Copy the connection string.

### 2. Switch Prisma from SQLite to Postgres
1. In [prisma/schema.prisma](prisma/schema.prisma), change datasource provider to `postgresql`.
2. Keep `url = env("DATABASE_URL")`.
3. Set local `DATABASE_URL` to your Neon URL.
4. Run:
   1. `npx prisma migrate dev --name init_postgres`
   2. `npx prisma generate`
   3. `npm run db:seed`

### 3. Verify locally before deploy
1. `npm run build`
2. `npm run dev`
3. Confirm:
   1. `/` redirects to `/login` when logged out
   2. login works (`ramshamehdi / Mehdi12345`)
   3. API returns 401 when unauthenticated

### 4. Deploy to Vercel
1. Push repo to GitHub.
2. In Vercel: New Project -> import this repo.
3. Add environment variables in Vercel (Production):
   1. `DATABASE_URL` = Neon URL
   2. `AUTH_SECRET` = long random secret
   3. `AUTH_URL` = your deployed domain (e.g. `https://your-app.vercel.app`)
4. Deploy.

### 5. Run production migration + seed once
1. From local machine (pointed at prod `DATABASE_URL`):
   1. `npx prisma migrate deploy`
   2. `npm run db:seed`
2. This creates your auth users and initial app data in production DB.

### 6. Post-deploy smoke test
1. Open deployed URL logged out -> should go to `/login`
2. Sign in with `ramshamehdi / Mehdi12345`
3. Create and read claims/patients
4. `curl -i https://<your-domain>/api/patients` without session -> `401`

---

### Why not SQLite file on Vercel?
Vercel functions are stateless/ephemeral; a local `.db` file won’t behave as persistent shared storage. Even with 2 users, writes can be lost or inconsistent.

---

If you want, next I can give you the **exact Prisma schema diff + exact commands** to execute in order for your repo, step-by-step copy/paste.