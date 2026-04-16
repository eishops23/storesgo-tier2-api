# 🚀 STORESGO BACKEND — DEPLOYMENT GUIDE

Production deployment instructions for PM2 + NGINX + PostgreSQL + Prisma.

---

## 📋 Prerequisites

- **Ubuntu 20.04+** or similar Linux server
- **Node.js 18+** (via nvm recommended)
- **PostgreSQL 14+**
- **PM2** (process manager)
- **NGINX** (reverse proxy)
- **Git** (for deployment)

---

## 1️⃣ Server Setup

### Install Node.js via NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18
```

### Install PM2 Globally

```bash
npm install -g pm2
```

### Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

---

## 2️⃣ Database Setup

### Create Database and User

```bash
sudo -u postgres psql
```

```sql
CREATE USER storesgo WITH PASSWORD 'your_secure_password';
CREATE DATABASE storesgo_prod OWNER storesgo;
GRANT ALL PRIVILEGES ON DATABASE storesgo_prod TO storesgo;
\q
```

### Set DATABASE_URL

```bash
# Add to ~/.bashrc or /etc/environment
export DATABASE_URL="postgresql://storesgo:your_secure_password@localhost:5432/storesgo_prod"
```

---

## 3️⃣ Application Deployment

### Clone Repository

```bash
cd /var/www
sudo mkdir -p storesgo-backend
sudo chown $USER:$USER storesgo-backend
git clone <your-repo-url> storesgo-backend
cd storesgo-backend
```

### Install Dependencies

```bash
npm ci --production=false
```

### Create Environment File

```bash
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://storesgo:your_secure_password@localhost:5432/storesgo_prod"

# Server
PORT=5000
HOST=0.0.0.0
NODE_ENV=production

# JWT Secrets (generate strong random strings)
JWT_SECRET="your-jwt-secret-here"
ADMIN_JWT_SECRET="your-admin-jwt-secret-here"
SELLER_JWT_SECRET="your-seller-jwt-secret-here"

# Optional: Redis (if using queues)
# REDIS_URL="redis://localhost:6379"
EOF
```

### Run Prisma Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate deploy

# Optional: Seed admin user
npx ts-node prisma/seedAdmin.ts
```

### Build TypeScript

```bash
npm run build
```

---

## 4️⃣ PM2 Configuration

### Create PM2 Ecosystem File

```bash
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: "storesgo-api",
      script: "./dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_memory_restart: "500M",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
};
EOF
```

### Create Logs Directory

```bash
mkdir -p logs
```

### Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the command it outputs

# Verify running
pm2 status
pm2 logs storesgo-api
```

### PM2 Commands Reference

```bash
# View status
pm2 status

# View logs
pm2 logs storesgo-api

# Restart
pm2 restart storesgo-api

# Stop
pm2 stop storesgo-api

# Delete
pm2 delete storesgo-api

# Monitor
pm2 monit
```

---

## 5️⃣ NGINX Configuration

### Install NGINX

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### Create Site Configuration

```bash
sudo nano /etc/nginx/sites-available/storesgo-api
```

```nginx
# /etc/nginx/sites-available/storesgo-api

upstream storesgo_api {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (use Certbot/Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Request limits
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # API proxy
    location /api {
        proxy_pass http://storesgo_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Health check (no auth required)
    location /api/health {
        proxy_pass http://storesgo_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Enable Site and Get SSL

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/storesgo-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Reload NGINX
sudo systemctl reload nginx
```

---

## 6️⃣ Firewall Setup (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 7️⃣ Deployment Script

Create a deployment script for updates:

```bash
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci --production=false

echo "🔨 Building TypeScript..."
npm run build

echo "🗄️ Running database migrations..."
npx prisma migrate deploy

echo "🔄 Restarting PM2..."
pm2 reload storesgo-api --update-env

echo "✅ Deployment complete!"
pm2 status
EOF

chmod +x deploy.sh
```

---

## 8️⃣ Monitoring & Logs

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs storesgo-api --lines 100

# View error logs only
pm2 logs storesgo-api --err
```

### NGINX Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 9️⃣ Health Check Endpoint

Test the API is running:

```bash
curl https://api.yourdomain.com/api/health
```

Expected response:

```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 3600
}
```

---

## 🔧 Troubleshooting

### API Not Responding

```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs storesgo-api

# Check if port is in use
sudo lsof -i :5000

# Restart PM2
pm2 restart storesgo-api
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U storesgo -d storesgo_prod

# Check DATABASE_URL in environment
echo $DATABASE_URL
```

### NGINX Issues

```bash
# Test configuration
sudo nginx -t

# Check NGINX status
sudo systemctl status nginx

# View error logs
sudo tail -50 /var/log/nginx/error.log
```

---

## 📦 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ❌ | Server port (default: 5000) |
| `HOST` | ❌ | Server host (default: 0.0.0.0) |
| `NODE_ENV` | ❌ | Environment (production/development) |
| `JWT_SECRET` | ✅ | Secret for buyer JWT tokens |
| `ADMIN_JWT_SECRET` | ✅ | Secret for admin JWT tokens |
| `SELLER_JWT_SECRET` | ✅ | Secret for seller JWT tokens |
| `REDIS_URL` | ❌ | Redis connection (for queues) |

---

## 🎯 API Endpoints Summary (Phase 6)

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/homepage/feed` | Homepage data |
| GET | `/api/homepage/featured` | Featured products |
| GET | `/api/homepage/new-arrivals` | New arrivals |
| GET | `/api/homepage/categories` | Categories with counts |
| GET | `/api/homepage/sellers` | Featured sellers |
| GET | `/api/homepage/stats` | Platform stats |
| GET | `/api/homepage/deals` | Active deals |
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/:id` | Product detail |
| GET | `/api/products/:id/recommend` | Recommended products |
| GET | `/api/products/search` | Search products |
| GET | `/api/products/seller/:sellerId` | Products by seller |
| GET | `/api/products/category/:categoryId` | Products by category |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:slug` | Category detail |
| GET | `/api/sellers` | List sellers (paginated) |
| GET | `/api/sellers/:identifier` | Seller detail (by ID or slug) |
| GET | `/api/seo/pages` | SEO pages (paginated) |
| GET | `/api/seo/pages/:slug` | SEO page detail |
| GET | `/api/seo/blog` | Blog posts (alias) |
| GET | `/api/seo/blog/:slug` | Blog post detail |
| GET | `/api/seo/guides` | Guides (alias) |
| GET | `/api/seo/guides/:slug` | Guide detail |
| GET | `/api/seo/deals` | Seasonal deals (paginated) |
| GET | `/api/seo/deals/:id` | Deal detail |

### Pagination Response Shape

All paginated endpoints return:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## ✅ Deployment Checklist

- [ ] Server provisioned with Ubuntu 20.04+
- [ ] Node.js 18+ installed via nvm
- [ ] PostgreSQL installed and running
- [ ] Database and user created
- [ ] Application cloned to `/var/www/storesgo-backend`
- [ ] `.env` file created with all secrets
- [ ] `npm ci` completed
- [ ] `npx prisma generate` completed
- [ ] `npx prisma migrate deploy` completed
- [ ] `npm run build` completed
- [ ] PM2 started and saved
- [ ] PM2 startup configured
- [ ] NGINX configured with SSL
- [ ] Firewall enabled (UFW)
- [ ] Health check returning OK
- [ ] Deploy script created

---

**Last Updated:** Phase 6 Backend Enhancements

