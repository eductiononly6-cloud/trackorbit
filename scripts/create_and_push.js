import { spawn } from 'child_process';
import https from 'https';

async function getGitToken() {
  return new Promise((resolve, reject) => {
    const p = spawn('git', ['credential', 'fill']);
    let output = '';
    p.stdout.on('data', d => { output += d.toString(); });
    p.on('close', code => {
      let token = null;
      let user = null;
      output.split('\n').forEach(line => {
        if (line.startsWith('username=')) user = line.replace('username=', '').trim();
        if (line.startsWith('password=')) token = line.replace('password=', '').trim();
      });
      if (token) resolve({ user, token });
      else reject(new Error('No token found in Git Credential Manager'));
    });
    p.stdin.write('protocol=https\nhost=github.com\n\n');
  });
}

async function createGitHubRepo(token, repoName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: repoName,
      description: 'TrackOrbit - Live Month Goal Tracker with Mon-Sat Splitting, Sunday Rest, and Native Widgets',
      private: false,
      auto_init: false
    });

    const req = https.request('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'User-Agent': 'TrackOrbit-Deployer',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Accept': 'application/vnd.github.v3+json'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode === 201 || res.statusCode === 200) {
            resolve(parsed);
          } else if (res.statusCode === 422 && body.includes('already exists')) {
            console.log(`Repository "${repoName}" already exists on GitHub. Proceeding to push.`);
            resolve({ clone_url: `https://github.com/${parsed.owner?.login || 'user'}/${repoName}.git`, html_url: `https://github.com/${parsed.owner?.login || 'user'}/${repoName}` });
          } else {
            reject(new Error(`GitHub API error ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Retrieving GitHub token from system Git Credential Manager...');
    const { user, token } = await getGitToken();
    console.log(`✓ Authenticated as: ${user}`);

    const repoName = 'trackorbit';
    console.log(`2. Creating GitHub repository "${repoName}" under ${user}...`);
    const repoInfo = await createGitHubRepo(token, repoName);
    console.log(`✓ Repository ready: ${repoInfo.html_url || `https://github.com/${user}/${repoName}`}`);

    console.log('3. Linking git remote origin...');
    const remoteUrl = `https://github.com/${user}/${repoName}.git`;
    
    // Set remote
    const setRemote = spawn('git', ['remote', 'add', 'origin', remoteUrl]);
    setRemote.on('close', () => {
      // If remote already exists, set url
      const setUrl = spawn('git', ['remote', 'set-url', 'origin', remoteUrl]);
      setUrl.on('close', () => {
        console.log('4. Pushing project to GitHub main branch...');
        const push = spawn('git', ['push', '-u', 'origin', 'main'], { stdio: 'inherit' });
        push.on('close', code => {
          if (code === 0) {
            console.log('\n🎉 SUCCESS! Project pushed to GitHub successfully!');
            console.log(`Repository: https://github.com/${user}/${repoName}`);
            console.log(`GitHub Actions Workflow: https://github.com/${user}/${repoName}/actions`);
          } else {
            console.error('Push failed with exit code:', code);
          }
        });
      });
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
