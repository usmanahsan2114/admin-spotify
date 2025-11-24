const { spawn } = require('child_process');
const fs = require('fs');

const logStream = fs.createWriteStream('build_debug.log');

const build = spawn('npm.cmd', ['run', 'build'], {
    cwd: process.cwd(),
    shell: true
});

build.stdout.pipe(logStream);
build.stderr.pipe(logStream);

build.on('close', (code) => {
    console.log(`Build exited with code ${code}`);
    logStream.end();
});
