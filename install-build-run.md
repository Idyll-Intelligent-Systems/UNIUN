# UNIUN — Install, Build, and Run (Local & AWS/ECS)

This guide walks through running UNIUN locally and deploying to AWS ECS. It covers both npm-based runs and Docker-based runs, and points to helper scripts for an end-to-end experience.

## Prerequisites

- Node.js 20.x and npm 10.x (for local npm runs)
- Docker and Docker Compose (for container-based runs)
- Git and a Bash shell
- AWS account with permissions for ECR and ECS (for production deploy)

Optional (recommended for prod):
- Managed MongoDB (Atlas/DocumentDB) and Neo4j (Aura) — see `infra/DB_SETUP.md`

Repo structure highlights:
- `frontend/` – Next.js 14 app
- `backend/` – Express + TypeScript API, static media serving
- `uploads/` – Local media files (mounted into backend container)
- `docker-compose.yml` – Local full stack (frontend, backend, MongoDB, Neo4j, Prometheus)
- `docker-compose.prod.yml` – Prod-like compose (frontend + backend only)
- `scripts/` – Helper scripts for local run and ECS deploy
- `infra/ecs/` – ECS task/service templates

---

## 1) Quick start (Docker): one command end-to-end

This builds images, starts all services, waits for health, seeds demo data, and prints the URL.

```bash
./scripts/run-local.sh
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/health
- Static media served under: http://localhost:4000/uploads and http://localhost:4000/avatars

This uses `docker-compose.yml`:
- Frontend container rewrites `/api`, `/uploads`, and `/avatars` to the backend.
- Backend serves `/uploads` directly from the local `./uploads` bind mount.

To stop:
```bash
docker compose down
```

To view logs:
```bash
docker compose logs -f backend
# or
docker compose logs -f frontend
```

---

## 2) Local development with npm (no Docker)

Run backend:
```bash
cd backend
npm ci
npm run build
npm start
# API on http://localhost:4000
```

Run frontend (in a separate terminal):
```bash
cd frontend
npm ci
npm run dev
# App on http://localhost:3000
```

Notes:
- In local dev, the frontend proxies `/api`, `/uploads`, and `/avatars` to `http://localhost:4000` (see `frontend/next.config.js`).
- For dev data seeding, the backend exposes `/api/dev/seed` when not in production.

Seed sample content:
```bash
curl -X POST http://localhost:4000/api/dev/seed
```

---

## 3) Media uploads in local

- Uploads go to `backend/uploads`, served at `/uploads`.
- When running via Docker, `./uploads` is mounted into the backend container; you can inspect files on host under `./uploads/images`, `./uploads/video`, or `./uploads/audio`.
- The Upload page posts a multipart form to `/api/media/upload`; the API responds with a `publicUrl` (e.g., `/uploads/images/<name>`), which is then saved on the post.

If media doesn’t appear:
- Ensure you’re logged in (Authorization is required for the upload endpoint).
- Verify the upload response is 200. The UI will now show an error and abort create if a file upload fails.
- Check backend logs: `docker compose logs -f backend`.

---

## 4) Production (AWS ECS) deployment

You can deploy separate frontend and backend services behind an ALB. At a high level:

1) Build and push images to ECR
- Create two ECR repos (e.g., `uniun-frontend` and `uniun-backend`).
- Tag and push images. Example commands (adapt to your account/region):

```bash
# Backend
cd backend
npm ci && npm run build
docker build -t <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/uniun-backend:latest .

# Frontend
cd ../frontend
npm ci && npm run build
docker build -t <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/uniun-frontend:latest .

# Login and push
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com
docker push <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/uniun-backend:latest
docker push <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/uniun-frontend:latest
```

2) Configure environment
- Use managed DBs where possible. See `infra/DB_SETUP.md` for MongoDB Atlas/DocumentDB, Neo4j Aura, and vector DB options.
- Required backend env vars (commonly via ECS task definition or SSM/Secrets Manager):
  - `PORT` (e.g., 4000)
  - `JWT_SECRET`
  - `MONGO_URI`
  - `MONGO_TIMEOUT_MS` (optional)
  - `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
  - Optional vector/OpenSearch or S3/GCS CDN envs
- Frontend container doesn’t need DB envs; it should include proxy envs for API routing if your ALB exposes different hostnames.

3) ALB listener rules
- Route `/api`, `/uploads`, `/avatars`, and `/ws` to the backend target group.
- Route `/` (and everything else) to the frontend target group.

4) Use the ECS templates
- Templates live in `infra/ecs/`. You can render them with your ARNs and environment, or adapt them in the AWS console.
- The backend listens on `/health` and `/api/health` for health checks.

5) Validate production
- Confirm frontend homepage loads.
- Hit `/api/health` and check 200.
- Upload media via the app; verify files are accessible via ALB paths (`/uploads/...`).

Scripts to help:
- `scripts/deploy-ecs.sh` — scaffolding to push images and create/update services.
- `scripts/deploy-ecs-mono.sh` — optional mono-service path if you prefer a single service.

---

## 5) Troubleshooting

- Backend 4xx during upload: likely missing/invalid JWT. Log in again and retry.
- Media 404 in prod: ensure ALB routes `/uploads` and `/avatars` to the backend; the backend serves these statically.
- Dev seed unavailable: dev endpoints are disabled when `NODE_ENV=production`.
- Next.js image optimizer: disabled; we use plain `img`/`video` tags for robustness.

---

## 6) Contributing

- Open PRs targeting `main` with clear descriptions.
- Run unit tests where applicable (`frontend`: `npm test`).
- Keep docs updated when changing infra or public APIs.

Thank you for contributing!
