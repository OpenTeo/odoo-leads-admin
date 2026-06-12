module.exports = {
  apps: [{
    name: "odoo-admin",
    script: "scripts/server.mjs",
    cwd: __dirname,
    watch: false,
    autorestart: true,
    max_restarts: 20,
    restart_delay: 3000,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    out_file: "logs/out.log",
    error_file: "logs/error.log",
    merge_logs: true
  }]
};
