# 🚀 STORESGO BACKEND — DEPLOYMENT & OPERATIONS GUIDE

Complete guide for deploying, monitoring, and operating the StoresGo backend in production.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes/OCI Deployment](#kubernetes-oci-deployment)
6. [CI/CD Pipeline](#ci-cd-pipeline)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Health Checks](#health-checks)
9. [Logging & Error Tracking](#logging--error-tracking)
10. [Runbooks](#runbooks)
11. [Security Checklist](#security-checklist)

---

## 🏗️ Architecture Overview

```
                                    ┌─────────────────┐
                                    │   Cloudflare    │
                                    │    (CDN/WAF)    │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  Load Balancer  │
                                    │   (OCI LB/K8s)  │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
     ┌────────▼────────┐           ┌────────▼────────┐           ┌────────▼────────┐
     │   API Pod #1    │           │   API Pod #2    │           │   API Pod #3    │
     │   (Fastify)     │           │   (Fastify)     │           │   (Fastify)     │
     └────────┬────────┘           └────────┬────────┘           └────────┬────────┘
              │                              │                              │
              └──────────────────────────────┼──────────────────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
     ┌────────▼────────┐           ┌────────▼────────┐           ┌────────▼────────┐
     │   PostgreSQL    │           │     Redis       │           │   Sentry        │
     │   (OCI DB)      │           │   (Queues)      │           │   (Errors)      │
     └─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

## ✅ Prerequisites

### Required Services
- **PostgreSQL 14+** — Primary database
- **Redis 7+** — Job queues and caching
- **Container Registry** — GitHub Container Registry (ghcr.io) or OCI Registry

### Required Tools
```bash
# For local development
node >= 20.0.0
npm >= 10.0.0
docker >= 24.0.0
docker-compose >= 2.20.0

# For Kubernetes deployment
kubectl >= 1.28.0
helm >= 3.13.0  # Optional

# For OCI deployment
oci-cli >= 3.0.0
```

---

## 🔧 Environment Configuration

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_SECRET` | ✅ | Secret for buyer JWT tokens |
| `ADMIN_JWT_SECRET` | ✅ | Secret for admin JWT tokens |
| `SELLER_JWT_SECRET` | ✅ | Secret for seller JWT tokens |
| `NODE_ENV` | ✅ | `production` for prod |
| `PORT` | ❌ | Server port (default: 5000) |
| `SENTRY_DSN` | ❌ | Sentry error tracking DSN |
| `OPENAI_API_KEY` | ❌ | OpenAI API key for AI features |

### Generating Secrets

```bash
# Generate secure JWT secrets
openssl rand -hex 64  # For JWT_SECRET
openssl rand -hex 64  # For ADMIN_JWT_SECRET
openssl rand -hex 64  # For SELLER_JWT_SECRET
```

---

## 🐳 Docker Deployment

### Build the Image

```bash
# Build production image
docker build -t storesgo-backend:latest .

# Build with specific tag
docker build -t storesgo-backend:v1.0.0 .

# Multi-platform build (for different architectures)
docker buildx build --platform linux/amd64,linux/arm64 -t storesgo-backend:latest .
```

### Run Locally with Docker Compose

```bash
# Start all services (API + PostgreSQL + Redis)
docker-compose up -d

# With monitoring stack
docker-compose --profile monitoring up -d

# View logs
docker-compose logs -f api

# Run database migrations
docker-compose --profile init run migrate

# Stop all services
docker-compose down
```

### Push to Registry

```bash
# Tag for GitHub Container Registry
docker tag storesgo-backend:latest ghcr.io/your-org/storesgo-backend:latest

# Login to registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push
docker push ghcr.io/your-org/storesgo-backend:latest
```

---

## ☸️ Kubernetes/OCI Deployment

### Initial Setup

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (update with real values first!)
kubectl apply -f k8s/secret.yaml

# Create configmap
kubectl apply -f k8s/configmap.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/network-policy.yaml
```

### Verify Deployment

```bash
# Check pod status
kubectl get pods -n storesgo-prod

# Check deployment status
kubectl rollout status deployment/storesgo-backend -n storesgo-prod

# View logs
kubectl logs -f deployment/storesgo-backend -n storesgo-prod

# Port forward for testing
kubectl port-forward svc/storesgo-backend 5000:80 -n storesgo-prod

# Test health endpoint
curl http://localhost:5000/api/health
```

### Rolling Update

```bash
# Update image
kubectl set image deployment/storesgo-backend \
  storesgo-backend=ghcr.io/your-org/storesgo-backend:v1.1.0 \
  -n storesgo-prod

# Watch rollout
kubectl rollout status deployment/storesgo-backend -n storesgo-prod

# Rollback if needed
kubectl rollout undo deployment/storesgo-backend -n storesgo-prod
```

### Scaling

```bash
# Manual scale
kubectl scale deployment/storesgo-backend --replicas=5 -n storesgo-prod

# HPA will auto-scale based on CPU/memory (already configured in hpa.yaml)
kubectl get hpa -n storesgo-prod
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/deploy-backend.yml`.

### Workflow Stages

1. **Lint & Type Check** — Validates TypeScript code
2. **Test** — Runs tests against PostgreSQL/Redis
3. **Build** — Creates Docker image and pushes to registry
4. **Deploy Staging** — Auto-deploys `staging` branch
5. **Deploy Production** — Auto-deploys `main` branch

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `OCI_CONFIG` | OCI CLI configuration file content |
| `OCI_KEY` | OCI API private key |
| `OCI_STAGING_INSTANCE_ID` | Container instance ID for staging |
| `OKE_KUBECONFIG` | Kubernetes config (base64 encoded) |
| `SLACK_WEBHOOK_URL` | Slack notification webhook |
| `SENTRY_AUTH_TOKEN` | Sentry release auth token |
| `SENTRY_ORG` | Sentry organization name |

### Manual Deployment

```bash
# Trigger deployment manually via GitHub Actions
gh workflow run deploy-backend.yml \
  -f environment=production
```

---

## 📊 Monitoring & Alerting

### Prometheus Metrics

The application exposes metrics at `/api/metrics` in Prometheus format.

**Available Metrics:**

| Metric | Type | Description |
|--------|------|-------------|
| `storesgo_http_requests_total` | Counter | Total HTTP requests |
| `storesgo_http_request_duration_seconds` | Histogram | Request duration |
| `storesgo_http_request_errors_total` | Counter | Error count |
| `storesgo_active_connections` | Gauge | Active connections |
| `storesgo_nodejs_heap_used_bytes` | Gauge | Node.js heap usage |
| `storesgo_queue_waiting_jobs` | Gauge | Queue backlog |

### Grafana Dashboard

Import the dashboard from `monitoring/grafana/provisioning/dashboards/json/storesgo-backend.json`.

Access Grafana at `http://localhost:3001` (docker-compose) with:
- Username: `admin`
- Password: `admin123` (change in production!)

### Alert Rules

Alerts are defined in `monitoring/alert.rules.yml`:

| Alert | Severity | Condition |
|-------|----------|-----------|
| `APIDown` | Critical | API unreachable for 1 minute |
| `HighResponseTime` | Warning | P95 > 2s for 5 minutes |
| `CriticalErrorRate` | Critical | Error rate > 10% |
| `HighCPUUsage` | Warning | CPU > 80% for 5 minutes |
| `PostgresDown` | Critical | Database unreachable |

### Alertmanager

Configure notification channels in `monitoring/alertmanager.yml`:

```bash
# Test alertmanager configuration
docker-compose --profile monitoring up alertmanager

# View active alerts
curl http://localhost:9093/api/v2/alerts
```

---

## 🏥 Health Checks

### Endpoints

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `GET /api/health` | Simple health check | `{"ok": true, "status": "healthy"}` |
| `GET /api/health/live` | Liveness probe | 200 if process running |
| `GET /api/health/ready` | Readiness probe | 200 if DB connected |
| `GET /api/health/startup` | Startup probe | 200 once initialized |
| `GET /api/health/detailed` | Full system status | Comprehensive JSON |

### Kubernetes Probe Configuration

```yaml
# Already configured in k8s/deployment.yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5

startupProbe:
  httpGet:
    path: /api/health/startup
    port: 5000
  failureThreshold: 30
  periodSeconds: 5
```

### External Uptime Monitoring

Set up external monitoring (Pingdom, UptimeRobot, etc.):
- **URL:** `https://api.storesgo.com/api/health`
- **Interval:** 1 minute
- **Alert threshold:** 2 consecutive failures

---

## 📝 Logging & Error Tracking

### Application Logs

Logs are written to stdout in JSON format (Pino).

```bash
# View logs in Kubernetes
kubectl logs -f deployment/storesgo-backend -n storesgo-prod

# View with jq for pretty printing
kubectl logs deployment/storesgo-backend -n storesgo-prod | jq .

# Docker Compose
docker-compose logs -f api | jq .
```

### Log Levels

| Level | When Used |
|-------|-----------|
| `error` | Unhandled exceptions, critical failures |
| `warn` | Recoverable errors, deprecation notices |
| `info` | Request/response, startup events |
| `debug` | Detailed debugging (dev only) |

### Sentry Error Tracking

Sentry captures:
- Unhandled exceptions
- 5xx HTTP errors
- Performance transactions (10% sample rate)

**Sentry Dashboard:** `https://sentry.io/organizations/your-org/projects/storesgo-backend/`

**Test Sentry Integration:**

```bash
# Development only endpoint
curl http://localhost:5000/api/debug/sentry-test
```

---

## 📖 Runbooks

### API Down

1. Check pod status: `kubectl get pods -n storesgo-prod`
2. Check logs: `kubectl logs -l app.kubernetes.io/name=storesgo-backend -n storesgo-prod`
3. Check database connectivity: `kubectl exec -it <pod> -- npm run healthcheck`
4. If pods are crashing, check events: `kubectl describe pod <pod-name>`
5. Rollback if recent deployment: `kubectl rollout undo deployment/storesgo-backend`

### High Memory Usage

1. Check current usage: `kubectl top pods -n storesgo-prod`
2. Check for memory leaks in application logs
3. Consider increasing memory limits in `k8s/deployment.yaml`
4. Restart pods if necessary: `kubectl rollout restart deployment/storesgo-backend`

### Database Connection Issues

1. Check database status in OCI console
2. Verify `DATABASE_URL` secret is correct
3. Check network policies allow database access
4. Test connection: `kubectl exec -it <pod> -- npx prisma db pull`

### High Response Time

1. Check Grafana dashboard for slow endpoints
2. Review recent deployments for regressions
3. Check database query performance
4. Consider scaling up: `kubectl scale deployment/storesgo-backend --replicas=5`

---

## 🔒 Security Checklist

### Pre-Deployment

- [ ] All secrets stored in Kubernetes Secrets (not ConfigMaps)
- [ ] JWT secrets are at least 64 characters
- [ ] Database SSL enabled (`?sslmode=require`)
- [ ] Redis password set (if accessible externally)
- [ ] CORS origin whitelist configured (not `*` in production)
- [ ] Rate limiting enabled
- [ ] Network policies applied

### Post-Deployment

- [ ] Verify HTTPS is enforced
- [ ] Test rate limiting works
- [ ] Verify Sentry captures test error
- [ ] Confirm alerts fire correctly
- [ ] Security scan container image
- [ ] Review Kubernetes RBAC permissions

### Regular Maintenance

- [ ] Rotate JWT secrets quarterly
- [ ] Update dependencies monthly
- [ ] Review access logs for anomalies
- [ ] Test disaster recovery procedures

---

## 🆘 Support

- **On-call:** oncall@storesgo.com
- **Slack:** #storesgo-alerts
- **PagerDuty:** (Configure in alertmanager.yml)

---

**Last Updated:** November 2024

