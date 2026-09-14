import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

console.log('--- Step 1: Building latest production bundle on current branch ---');
run('npm run build');

const tmpDir = path.resolve('/tmp/dist-deploy-' + Date.now());
if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
fs.cpSync(path.resolve('./dist'), tmpDir, { recursive: true });

console.log('--- Step 2: Switching to gh-pages branch ---');
run('git checkout gh-pages');

console.log('--- Step 3: Updating gh-pages root files ---');
if (fs.existsSync('./assets')) {
  fs.rmSync('./assets', { recursive: true, force: true });
}
fs.cpSync(tmpDir, path.resolve('.'), { recursive: true });
fs.writeFileSync('.nojekyll', '');

console.log('--- Step 4: Committing and pushing to origin gh-pages ---');
run('git add -A');
try {
  run('git commit -m "Deploy latest build to gh-pages root"');
  run('git push origin gh-pages');
} catch {
  console.log('No changes to commit or push.');
}

console.log('--- Step 5: Returning to master branch ---');
run('git checkout master');

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('Successfully deployed to gh-pages!');
