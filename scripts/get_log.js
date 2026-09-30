import { spawn } from 'child_process';
import https from 'https';

async function getToken() {
  return new Promise((resolve) => {
    const p = spawn('git', ['credential', 'fill']);
    let output = '';
    p.stdout.on('data', d => output += d);
    p.on('close', () => {
      let token = '';
      output.split('\n').forEach(l => {
        if (l.startsWith('password=')) token = l.replace('password=', '').trim();
      });
      resolve(token);
    });
    p.stdin.write('protocol=https\nhost=github.com\n\n');
  });
}

async function run() {
  const token = await getToken();
  const req = https.request('https://api.github.com/repos/eductiononly6-cloud/trackorbit/actions/jobs/110099231445/logs', {
    headers: {
      'User-Agent': 'TrackOrbit',
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github.v3+json'
    }
  }, res => {
    if (res.statusCode === 302) {
      https.get(res.headers.location, r2 => {
        let logData = '';
        r2.on('data', c => logData += c);
        r2.on('end', () => {
          const lines = logData.split('\n');
          const errIndex = lines.findIndex(l => l.includes('FAILURE: Build failed with an exception.'));
          if (errIndex !== -1) {
            console.log(lines.slice(Math.max(0, errIndex - 20), errIndex + 30).join('\n'));
          } else {
            console.log(lines.slice(-50).join('\n'));
          }
        });
      });
    } else {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => console.log(body));
    }
  });
  req.end();
}

run();
