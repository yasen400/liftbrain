# LiftBrain Deployment Guide

This walkthrough provisions a single EC2 host with Terraform, boots Docker via cloud-init, and serves LiftBrain behind Caddy with automatic HTTPS. Follow each numbered section in order; the process takes about 15 minutes once prerequisites are ready.

## 1. Prerequisites

1. **AWS account + IAM user** with permissions for EC2, VPC, and IAM key pairs.
2. **AWS CLI** installed locally and configured (`aws configure`).
3. **Terraform 1.6+** installed locally.
4. **Existing EC2 key pair** in your target AWS region (used for SSH).
5. **Git repository URL** that the EC2 host can clone (public HTTPS or private via deploy key).
6. **Production `.env` file** with real secrets (see step 2).
7. (Optional) **Domain + DNS access** if you want HTTPS via your own hostname.

## 2. Prepare configuration & secrets

1. Copy the sample environment file and fill it with production values:
   ```bash
   cp .env.example .env
   # edit .env with real secrets
   ```
2. Set unique values for `SESSION_SECRET`, `JWT_SECRET`, and `NEXTAUTH_SECRET` (use `openssl rand -base64 32`).
3. Add your `OPENAI_API_KEY`, update `APP_URL`/`APP_DOMAIN`, and confirm `DATABASE_URL` points to the bundled SQLite file (`file:./prisma/dev.db`).
4. Keep this `.env` **out of version control**. You will upload it to the EC2 host after Terraform creates the server (step 5).

## 3. Configure Terraform variables

1. Change into the Terraform folder:
   ```bash
   cd infra/terraform
   ```
2. Copy the example variable file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
3. Edit `terraform.tfvars` with your details:

   | Variable | Description |
   | --- | --- |
   | `aws_region` | AWS region to deploy into (e.g., `us-east-1`). |
   | `key_name` | Existing EC2 key pair for SSH. |
   | `repo_url` | Git URL the server should clone (usually your GitHub repo). |
   | `allowed_ssh_cidr` | IP/CIDR allowed to SSH (restrict to your IP, e.g., `203.0.113.10/32`). |
   | `letsencrypt_email` | Email passed to Caddy for TLS issuance. |
   | `app_domain` | Optional domain pointing to the EC2 instance (leave blank to use the public DNS/IP). |
   | `instance_type` | (Optional) override the default `t3.micro` if you need more resources. |

## 4. Provision infrastructure

1. Initialize Terraform providers:
   ```bash
   terraform init
   ```
2. Review the plan:
   ```bash
   terraform plan -var-file=terraform.tfvars
   ```
3. Apply the infrastructure (type `yes` to confirm):
   ```bash
   terraform apply -var-file=terraform.tfvars
   ```
4. Terraform outputs the public IP/DNS when finished. Keep these handy for SSH and DNS updates.

## 5. Upload secrets & restart the stack

The cloud-init script copies `.env.example`, so you must replace it with your production secrets once the host is ready.

1. SSH into the new instance (replace values with your IP/key):
   ```bash
   ssh -i /path/to/key.pem ubuntu@<instance_public_ip>
   ```
2. On your local machine, upload the prepared `.env` file:
   ```bash
   scp -i /path/to/key.pem .env ubuntu@<instance_public_ip>:/opt/liftbrain/.env
   ```
3. Back on the server, restart the stack to pick up new secrets:
   ```bash
   cd /opt/liftbrain
   docker compose pull
   docker compose up -d --build
   ```
4. Confirm containers are healthy:
   ```bash
   docker compose ps
   ```

## 6. Point DNS (optional but recommended)

1. Create an `A` record for your domain (e.g., `liftbrain.example.com`) pointing to the instance’s public IP.
2. Ensure the same domain value appears in both `terraform.tfvars` (`app_domain`) and `.env` (`APP_DOMAIN`).
3. Caddy automatically requests/renews TLS certificates via Let’s Encrypt once DNS resolves.

## 7. Deploying updates

1. Push code changes to the Git repository referenced by `repo_url`.
2. SSH into the instance and pull the latest code:
   ```bash
   ssh -i /path/to/key.pem ubuntu@<instance_public_ip>
   cd /opt/liftbrain
   git pull origin main   # adjust branch if needed
   docker compose build --pull
   docker compose up -d
   ```
3. For environment variable updates, edit `/opt/liftbrain/.env`, then rerun `docker compose up -d`.

## 8. Destroying the environment

When you no longer need the stack:

```bash
cd infra/terraform
terraform destroy -var-file=terraform.tfvars
```

## 9. Troubleshooting tips

- **App not reachable:** Check `docker compose ps` and `docker compose logs app` on the server.
- **TLS failures:** Ensure DNS points to the instance and port 80/443 are open (handled by the security group). Re-run `docker compose up -d` after fixing DNS.
- **SSH denied:** Update `allowed_ssh_cidr` and rerun `terraform apply`, or use AWS console to adjust the security group temporarily.
- **OpenAI errors:** Verify `OPENAI_API_KEY` exists in `/opt/liftbrain/.env` and restart the stack.

Following these steps end-to-end gives you a reproducible, single-host deployment ready for small teams.
