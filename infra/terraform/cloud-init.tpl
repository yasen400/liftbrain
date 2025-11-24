#cloud-config
package_update: true
package_upgrade: true
packages:
  - docker.io
  - docker-compose-plugin
runcmd:
  - [ sh, -c, "usermod -aG docker ubuntu" ]
  - [ sh, -c, "mkdir -p /opt/liftbrain" ]
  - [ sh, -c, "cd /opt && if [ ! -d liftbrain ]; then git clone ${repo_url} liftbrain; else cd liftbrain && git pull; fi" ]
  - [ sh, -c, "cd /opt/liftbrain && cp .env.example .env || true" ]
  - [ sh, -c, "cd /opt/liftbrain && docker compose pull" ]
  - [ sh, -c, "cd /opt/liftbrain && LETSENCRYPT_EMAIL=${letsencrypt_email} APP_DOMAIN=${app_domain} docker compose up -d" ]
