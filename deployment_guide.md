# Production Deployment Guide: Latin Study Companion

This guide explains how to deploy the Latin Study Companion application to your production server running **Docker Rootless**, reverse-proxied with SSL/HTTPS, and coordinated automatically using **GitHub Actions**.

---

## 1. Prerequisites on the Server
Your server needs:
1. **Docker & Docker Compose** configured in **Rootless Mode** (running under your host user session).
2. **Ports 80 & 443** open for HTTP/HTTPS traffic.
3. A **Domain Name** pointing to your server's public IP address (e.g. `latin.yourdomain.com`).

---

## 2. Option A: Setup Reverse Proxy on the Server with Caddy (Recommended)
Caddy is the simplest way to get automatic SSL/HTTPS certificates.

1. Install Caddy on your server.
2. Edit `/etc/caddy/Caddyfile` on the host:
   ```caddy
   latin.yourdomain.com {
       reverse_proxy localhost:10003
   }
   ```
3. Restart Caddy (`sudo systemctl restart caddy`). Caddy will automatically request and renew your SSL certificate.

---

## 3. Option B: Setup Reverse Proxy on the Server with Nginx & Certbot
If you prefer Nginx:
1. Create an Nginx config file under `/etc/nginx/sites-available/latin`:
   ```nginx
   server {
       listen 80;
       server_name latin.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:10003;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
2. Enable the config and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/latin /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
3. Obtain the SSL Certificate:
   ```bash
   sudo certbot --nginx -d latin.yourdomain.com
   ```

---

## 4. Setting up GitHub Secrets
To allow the GitHub Actions workflow to deploy code changes automatically, add the following secrets to your GitHub repository (**Settings > Secrets and variables > Actions**):

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `SERVER_HOST` | IP address or hostname of your production server | `12.34.56.78` |
| `SERVER_USER` | SSH login username (under which rootless Docker runs) | `arne` |
| `SSH_PRIVATE_KEY` | Private SSH key (matching a key in server's `authorized_keys`) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH port (optional, defaults to `22`) | `22` |

---

## 5. How the Deployment Pipeline Works
1. When you push to the `main` branch, the [deploy.yml](file:///.github/workflows/deploy.yml) workflow is triggered.
2. It builds the production Docker image (compiling the Vite build client-side inside the builder container) and pushes it to **GitHub Container Registry (GHCR)**.
3. It copies the updated `docker-compose.prod.yml` to your server's home directory.
4. It connects to your server via SSH, pulls the latest Docker image from GHCR, and restarts the web service on port **`10003`** (non-privileged port compatible with rootless Docker).
5. Old dangling images are pruned automatically to save disk space.
