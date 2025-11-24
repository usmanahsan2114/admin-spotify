const http = require('http');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/monitor.log');
const HEALTH_URL = 'http://localhost:5000/api/health';

// Ensure logs directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
    console.log(logEntry.trim());
}

const req = http.get(HEALTH_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const health = JSON.parse(data);
                log(`Health Check OK - Uptime: ${health.uptime}s, DB Latency: ${health.database.latency}ms, Memory: ${health.performance.memory.rss}MB`);
            } catch (e) {
                log(`Health Check Failed - Invalid JSON: ${e.message}`, 'ERROR');
            }
        } else {
            log(`Health Check Failed - Status: ${res.statusCode}`, 'ERROR');
        }
    });
});

req.on('error', (err) => {
    log(`Health Check Failed - Connection Error: ${err.message}`, 'ERROR');
});

req.end();
