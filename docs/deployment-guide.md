# LiftBrain Deployment Guide

This guide is written for someone who would rather click buttons than memorize cloud jargon. Each section is short, written in plain English, and includes what to type or click. Go step by step—do not jump ahead—and check items off as you go.

> **Estimated time:** ~45 minutes on your first run (mostly waiting for AWS).

---

## 1. Before you start (5–10 min)

| What you need | Why you need it | How to get it |
| --- | --- | --- |
| **AWS account** with an IAM user | Lets you create the virtual server | Visit aws.amazon.com, create an account, then in the AWS console open **IAM → Users → Add users**. Give it “Programmatic access” and attach the policies **AmazonEC2FullAccess**, **AmazonVPCFullAccess**, and **AmazonEC2KeyPairManagement**. Download the Access Key + Secret. |
| **AWS CLI** | Command-line tool Terraform relies on | Download “AWS CLI for Windows” from https://aws.amazon.com/cli/, run the installer, then in PowerShell run `aws --version` to confirm. |
| **`aws configure` run once** | So AWS CLI knows your keys and region | In PowerShell: `aws configure`, paste the Access Key, Secret, default region (`us-east-1` works), and pick `json` for output. |
| **Terraform 1.6 or newer** | Tool that creates the server | Download from https://www.terraform.io/downloads. Extract `terraform.exe` somewhere on your PATH (e.g., `C:\Terraform`) and run `terraform version`. |
| **Existing EC2 key pair** | Needed for SSH (secure remote login) | In the AWS console open **EC2 → Key Pairs → Create key pair**. Pick the same region you’ll deploy to, download the `.pem` file, and keep it safe. |
| **Git repo URL** | The server clones your code from here | If your repo is public you’re done. If private, either (a) add a deploy key and use the SSH URL or (b) use a token-based HTTPS URL. |
| **Filled-out `.env` file** | Holds your secrets (API keys, etc.) | Run `cp .env.example .env`, edit it with real values (see Section 2), and keep it on your laptop—it is **not** checked into git. |
| (Optional) **Domain name + DNS access** | Pretty HTTPS URL | Buy/own a domain and have access to its DNS panel (Route53, Cloudflare, etc.). |

When every box above is ready, move on.

---

## 2. Fill in the `.env` file (5 min)

1. In the project folder run `cp .env.example .env` (or duplicate the file in Explorer).
2. Open `.env` in your editor and update:
   - `APP_URL` → the URL you will visit (e.g., `https://liftbrain.example.com`).
   - `SESSION_SECRET`, `JWT_SECRET`, `NEXTAUTH_SECRET` → generate random strings. On Windows PowerShell you can run `openssl rand -base64 32` three times.
   - `OPENAI_API_KEY` → your real OpenAI key.
   - `LETSENCRYPT_EMAIL` and `APP_DOMAIN` → match your real email/domain.
3. Do **not** commit `.env`. The file only lives on your machine until you upload it later.

> **Mini-check:** Save the file and keep note of its location—you’ll upload it in Section 6.

---

## 3. Tell Terraform about your environment (10 min)

1. In PowerShell (from the project root) run:
   ```powershell
   cd infra/terraform
   cp terraform.tfvars.example terraform.tfvars
   ```
2. Open `infra/terraform/terraform.tfvars` and edit the values:
   - `aws_region`: Choose the same region as your key pair (e.g., `us-east-1`).
   - `key_name`: The name of the EC2 key pair you just created.
   - `repo_url`: URL that the server can clone (e.g., `https://github.com/you/liftbrain.git`).
   - `allowed_ssh_cidr`: Paste your public IP followed by `/32`. To find it, visit `https://ifconfig.me`.
   - `letsencrypt_email`: Same as `.env`.
   - `app_domain`: Leave blank to use the AWS public DNS, or set your custom domain.
   - `instance_type`: Optional—stick with `t3.micro` for testing.
3. Save the file. Terraform now knows everything it needs.

---

## 4. Create the server with Terraform (10–15 min)

Still inside `infra/terraform`, run these commands one after another:

```powershell
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

- `terraform init` downloads plugins—expect a minute of output.
- `terraform plan` shows what will be created. No changes happen yet.
- `terraform apply` asks “Do you want to perform these actions?” Type `yes` and press Enter. Terraform now builds the EC2 instance, security group, and bootstrap script.

When it completes you’ll see two outputs:

- `instance_public_ip`
- `instance_public_dns`

Write them down; we’ll use them for SSH/DNS.

---

## 5. Wait for the server to finish booting (3–5 min)

AWS still needs a couple of minutes after Terraform finishes. Use this time to confirm the instance exists in the AWS console (EC2 → Instances). When its status is “running” and “2/2 checks passed”, continue.

---

## 6. Upload your `.env` and restart the app (10 min)

Terraform deployed LiftBrain using the placeholder `.env.example`. Replace it with your real file:

1. **SSH into the box** (replace with your paths/IP):
   ```powershell
      ssh -i C:\gymAIapp\liftbrain\yasenapp.pem ubuntu@ec2-51-21-162-140.eu-north-1.compute.amazonaws.com
   ```
   First-time SSH usually asks “Are you sure you want to continue connecting?”—type `yes`.
2. **Upload `.env` from your laptop**:
   ```powershell
   scp -i C:\path\to\key.pem C:\path\to\your\.env ubuntu@<instance_public_ip>:/opt/liftbrain/.env
   ```
   If you’re on Windows and `scp` isn’t available, install **OpenSSH Client** from Windows optional features or use a GUI tool like WinSCP.
3. **Restart the app to use the new secrets** (still on the server):
   ```bash
   cd /opt/liftbrain
   docker compose pull
   docker compose up -d --build
   docker compose ps
   ```
   The last command should list `app`, `caddy`, and `backup` with status “running”.

---

## 7. Point your domain (optional but recommended)

1. In your DNS provider create an **A record** (host `@` or `app`) pointing to `instance_public_ip`.
2. Ensure `app_domain` in `terraform.tfvars` **and** `APP_DOMAIN` in `.env` match this domain.
3. Give DNS 5–10 minutes. When it resolves, Caddy automatically issues HTTPS certificates. Visit `https://your-domain` to verify.

> Skipping DNS? No problem. Visit `http://instance_public_ip` instead (without HTTPS).

---

## 8. Deploying future updates (5 min)

When you push new code to Git:

```powershell
ssh -i C:\path\to\key.pem ubuntu@<instance_public_ip>
cd /opt/liftbrain
git pull origin main   # change "main" if you use another branch
docker compose build --pull
docker compose up -d
```

- Need to change secrets later? Edit `/opt/liftbrain/.env`, then run `docker compose up -d` again.
- Want zero-downtime? Stop here—this single-instance setup is intentionally simple.

---

## 9. Tearing everything down (3 min)

When you’re done testing and want to avoid AWS charges:

```powershell
cd infra/terraform
terraform destroy -var-file=terraform.tfvars
```

Say `yes` when prompted. Terraform removes the EC2 instance and its security group.

---

## 10. Friendly troubleshooting checklist

| Symptom | Quick checks |
| --- | --- |
| **Can’t SSH** | Is the instance running? Did you use the right key file/region? Does `allowed_ssh_cidr` include your current IP? |
| **Website won’t load** | Run `docker compose ps` on the server. If `app` exited, run `docker compose logs app` to see why. |
| **TLS/HTTPS fails** | Confirm your DNS A record points to the EC2 public IP and wait a few minutes. Re-run `docker compose up -d` to retry certificate issuance. |
| **OpenAI errors** | Double-check `OPENAI_API_KEY` inside `/opt/liftbrain/.env` and restart the stack. |
| **Terraform apply fails** | Make sure `aws configure` was run with the right credentials and that your IAM user has EC2 permissions. |

Need more help? Capture the exact command and error message you see, then ask in your preferred support channel or open a GitHub issue.

---

Take a breath—you now have LiftBrain running on your own AWS instance! The entire process is repeatable and keeps everything on a single, low-cost box.
