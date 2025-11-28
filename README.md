## LiftBrain

LiftBrain is a small-footprint strength training OS for solo lifters or tiny squads (≈4 users). It keeps everything on a single EC2 instance: Next.js UI + API routes, SQLite via Prisma, OpenAI-powered coaching, reverse proxy, and cron-based backups. Infrastructure is reproducible with Terraform and docker-compose.

### Architecture Highlights

- **App**: Next.js 14 (App Router, TypeScript, Tailwind). API routes handle auth, workout logs, analytics, and AI prompts.
- **Metrics**: Server-rendered dashboards pull live stats through `getDashboardData` (weekly sets, muscle volume, and estimated 1RM trends).
- **Data**: Prisma + SQLite stored on a Docker volume. For such a tiny user base SQLite removes the need for a managed database while still providing ACID semantics.
- **AI Integration**: Server-side OpenAI client (`OPENAI_API_KEY`) with strict JSON schemas for plan generation/adjustments.
- **Hosting**: One Ubuntu t3.micro EC2 instance in the default VPC. Docker Compose orchestrates the app, Caddy (TLS + reverse proxy), and a lightweight backup cron container.
- **IaC**: Terraform provisions the EC2 instance, security group, and cloud-init bootstrap script that installs Docker, clones this repo, and runs `docker compose up -d`.

### Monorepo Layout

```
├── docker-compose.yml          # app + caddy + backup
├── Dockerfile                  # multi-stage Next.js build
├── prisma/                     # SQLite schema + migrations later
├── src/                        # Next.js app (dashboard, API routes, AI helpers)
├── infra/
│   ├── caddy/Caddyfile         # HTTPS termination & reverse proxy
│   ├── backup/cron/root        # nightly SQLite tarball
│   └── terraform/              # providers.tf, main.tf, variables.tf, outputs.tf, cloud-init.tpl
└── README.md
```

## Local Development

1. Install dependencies: `npm install`
2. Copy `.env.example` → `.env` and set secrets (especially `OPENAI_API_KEY` if you want to hit the AI endpoint).
3. Generate the Prisma client and create the dev database:
	```bash
	npx prisma generate
	npx prisma migrate dev --name init # optional once migrations exist
	```
4. Seed the exercise library + demo user (password `demo1234`): `npm run prisma:seed`
5. Start the dev server: `npm run dev`
6. Visit [http://localhost:3000](http://localhost:3000)
7. Hit `/register` to create your own account, then `/login` to sign in (NextAuth credentials provider + bcrypt hashes).

### Progress photo uploads (Phase 2)

The new progress photo workflow signs uploads directly against S3 (or any S3-compatible bucket). Set the following environment variables in `.env` (or your deployment secrets) before using `/api/uploads/progress-photo`:

| Variable | Purpose |
| --- | --- |
| `PROGRESS_PHOTO_BUCKET` | Target bucket for storing images |
| `PROGRESS_PHOTO_REGION` | AWS region for that bucket |
| `PROGRESS_PHOTO_PUBLIC_URL` | Optional CDN/base URL (defaults to the S3 HTTPS URL) |
| `PROGRESS_PHOTO_ACCESS_KEY_ID` / `PROGRESS_PHOTO_SECRET_ACCESS_KEY` | Credentials with `s3:PutObject` permissions (falls back to `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` if omitted) |

Client uploads are limited to 10 MB JPEG/PNG/WebP/HEIC images. Missing env vars will cause the API route to return a 500 until configured.

### AI analysis pipelines (Phase 3)

Phase 3 adds three server-side analysis steps that can be triggered on-demand (or from a cron runner):

| Route | Purpose |
| --- | --- |
| `POST /api/ai/compliance` | Summarizes the last seven logged sessions (set completion, RPE deltas, lagging movements) and stores an `AiRecommendation` row. |
| `POST /api/ai/body-comp` | Reviews the latest weight/check-in data plus progress-photo URLs to recommend macro adjustments. |
| `POST /api/ai/weekly-plan` | Runs both analyzers, combines the results, and creates a `WeeklyPlan` + optional `MealPrep` entries for the upcoming week. |

All three routes default to GPT-4.1 class models. Override them via `.env` if needed:

```
AI_COMPLIANCE_MODEL=gpt-4.1-mini
AI_BODY_COMP_MODEL=gpt-4.1
AI_WEEKLY_PLAN_MODEL=gpt-4.1
```

They reuse `OPENAI_API_KEY` and expect recent workout data + check-ins (weight/photo) to be present—otherwise the routes return `400` with a helpful error.

### Useful Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run compiled app |
| `npm run lint` | ESLint |
| `npm run prisma:generate` | (Add to package.json) Generate Prisma client |

## Docker Workflow

```bash
docker compose build
docker compose up -d
```

- `app` exposes port 3000 internally; Caddy terminates TLS on 80/443 and routes to `app:3000`.
- `.env` feeds the container secrets (Session/JWT secrets, OpenAI key, etc.).
- The `app_data` volume keeps `prisma/dev.db` so state survives deployments.
- Nightly cron compresses the SQLite file into `/data/liftbrain-YYYYMMDD.tar.gz` inside the volume (copy it off-box or sync to S3 manually).

## Terraform Deployment (Single Command Flow)

> Need a detailed walkthrough? See `docs/deployment-guide.md` for prerequisites, SSH/secrets upload, DNS, and lifecycle tips.

Prereqs: Terraform ≥ 1.6, AWS CLI configured (`aws configure`), existing EC2 key pair for SSH, Route53 (optional) pointing your domain to the instance.

1. `cd infra/terraform`
2. Copy `terraform.tfvars.example` → `terraform.tfvars` and fill values:
	```hcl
	aws_region       = "us-east-1"
	key_name         = "my-keypair"
	repo_url         = "https://github.com/you/liftbrain.git"
	allowed_ssh_cidr = "203.0.113.10/32"
	letsencrypt_email = "you@example.com"
	app_domain       = "liftbrain.example.com"
	```
3. `terraform init`
4. `terraform apply`
5. Outputs show public IP + DNS. Once `cloud-init` finishes the site is reachable via the public DNS or your domain.
6. (Optional) SSH in for troubleshooting: `ssh -i key.pem ubuntu@<public_dns>`

Destroying everything: `terraform destroy`

### Cloud-Init Recap

The bootstrap script on the EC2 host:
1. Installs Docker + compose plugin
2. Clones this repo into `/opt/liftbrain`
3. Copies `.env.example` if `.env` is missing (you can later edit with real secrets)
4. Runs `docker compose pull && docker compose up -d`

## Next Steps

- Persist AI plans into `WorkoutTemplate` records and expose approval flows
- Flesh out analytics queries (Prisma aggregations → Recharts)
- Harden the backup workflow (sync tarballs to S3 or automate downloads)
- Add progressive overload insights (e.g., rolling tonnage trends, 1RM estimates)
- Backfill integration tests for workout logging + history endpoints

## Troubleshooting

- **OpenAI errors**: ensure `OPENAI_API_KEY` is set in `.env` or injected into the EC2 environment before `docker compose up`.
- **Docker compose fails on EC2**: confirm the repo URL in Terraform is reachable (public HTTPS) and that the key pair allows SSH if you need to log in.
- **Port 80/443 already in use**: stop `apache2` or other daemons on the host before re-running compose.
