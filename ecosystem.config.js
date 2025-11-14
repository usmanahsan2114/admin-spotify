module.exports = {
  apps: [
    {
      name: 'shopify-admin-backend',
      script: './backend/server.js',
      cwd: process.cwd(),
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
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
    }
  ]
}

