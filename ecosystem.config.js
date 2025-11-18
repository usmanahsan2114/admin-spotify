module.exports = {
  apps: [
    {
      name: 'shopify-admin-backend',
      script: './backend/server.js',
      cwd: process.cwd(),
      // Use single instance for resource-constrained environments (shared hosting or small VMs)
      // Change to 2+ instances for VPS/dedicated servers with more resources
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: process.env.PM2_INSTANCES > 1 ? 'cluster' : 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
      // Health check for PM2
      health_check_grace_period: 3000,
      health_check_interval: 30000,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    }
  ]
}

