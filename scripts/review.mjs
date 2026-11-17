import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import console from 'node:console';
rmSync('review.zip', { force: true });
execFileSync('zip', ['-q', '-r', 'review.zip', 'dist/review', 'src', 'server', 'scripts', 'public/styles.css', 'public/index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'webflow.json', 'README.md']);
console.log('Created review.zip with source and matching private source maps.');
