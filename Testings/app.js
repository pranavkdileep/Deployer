const { spawn } = require('child_process');

const child = spawn('apt', ['update']);

let line = 0;
child.stdout.on('data', (data) => {
  console.log(`${line++}child stdout:\n${data}`);
});