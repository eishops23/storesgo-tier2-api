/**
 * PM2 Ecosystem Configuration
 * Automatic process restart on crash, clustering, and monitoring
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --only storesgo-api
 *   pm2 reload ecosystem.config.js --update-env
 * 
 * Monitoring:
 *   pm2 monit
 *   pm2 logs storesgo-api
 *   pm2 status
 */

module.exports = {
  apps: [
    // ==========================================================
    // 🚀 Main API Server
    // ==========================================================
    {
      name: "storesgo-api",
      script: "./dist/server.js",
      
      // Clustering (use all CPU cores in production)
      instances: process.env.PM2_INSTANCES || "max",
      exec_mode: "cluster",
      
      // Auto-restart configuration
      autorestart: true,
      watch: false, // Disable in production
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      
      // Restart delay and limits
      restart_delay: 4000, // Wait 4 seconds before restart
      max_restarts: 10, // Max restarts in a row
      min_uptime: "10s", // Minimum uptime before considering "stable"
      
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
      
      // Graceful shutdown
      kill_timeout: 5000, // Give 5 seconds for graceful shutdown
      wait_ready: true, // Wait for process.send('ready')
      listen_timeout: 10000, // Max time to wait for ready signal
      
      // Environment variables
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        PM2_INSTANCES: "max",
      },
      
      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      merge_logs: true,
      
      // Source maps for better stack traces
      source_map_support: true,
      
      // Cron restart (optional - restart at 3 AM daily for cleanup)
      // cron_restart: "0 3 * * *",
    },
    
    // ==========================================================
    // 🔧 Background Worker (for queue processing)
    // ==========================================================
    {
      name: "storesgo-worker",
      script: "./dist/workers/index.js",
      
      // Workers typically run as single instance
      instances: 1,
      exec_mode: "fork",
      
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      
      // Restart settings
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
      exp_backoff_restart_delay: 100,
      
      // Environment
      env: {
        NODE_ENV: "development",
        WORKER_MODE: "true",
      },
      env_production: {
        NODE_ENV: "production",
        WORKER_MODE: "true",
      },
      
      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/worker-error.log",
      out_file: "./logs/worker-out.log",
      merge_logs: true,
    },
  ],
  
  // ==========================================================
  // 📦 Deployment Configuration
  // ==========================================================
  deploy: {
    production: {
      user: "deploy",
      host: ["production-server.example.com"],
      ref: "origin/main",
      repo: "git@github.com:username/storesgo-backend.git",
      path: "/var/www/storesgo-backend",
      "pre-deploy-local": "",
      "post-deploy": "npm ci && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
      },
    },
    staging: {
      user: "deploy",
      host: ["staging-server.example.com"],
      ref: "origin/develop",
      repo: "git@github.com:username/storesgo-backend.git",
      path: "/var/www/storesgo-backend-staging",
      "post-deploy": "npm ci && npm run build && pm2 reload ecosystem.config.js --env staging",
      env: {
        NODE_ENV: "staging",
      },
    },
  },
};

