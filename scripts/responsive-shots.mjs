/**
 * Capture the running Vite app at several phone/tablet viewports.
 * Usage: node scripts/responsive-shots.mjs
 */
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.APP_URL || 'http://127.0.0.1:5174/';
const OUT = join(process.cwd(), 'tmp-responsive-shots');

const DEVICES = [
  { name: 'iphone-se-320', w: 320, h: 568 },
  { name: 'iphone-16e-390', w: 390, h: 844 },
  { name: 'iphone-17-pro-402', w: 402, h: 874 },
  { name: 'pixel-medium-412', w: 412, h: 915 },
  { name: 'iphone-pro-max-430', w: 430, h: 932 },
  { name: 'ipad-mini-768', w: 768, h: 1024 },
  { name: 'ipad-pro-11-834', w: 834, h: 1194 }
];

mkdirSync(OUT, { recursive: true });

for (const d of DEVICES) {
  const file = join(OUT, `${d.name}.png`);
  const result = spawnSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${d.w},${d.h}`,
      `--screenshot=${file}`,
      '--virtual-time-budget=8000',
      URL
    ],
    { encoding: 'utf8', timeout: 25000 }
  );
  if (result.status === 0) {
    console.log(`ok ${d.name} ${d.w}x${d.h} -> ${file}`);
  } else {
    console.error(`fail ${d.name}`, result.stderr?.slice(0, 400) || result.error);
  }
}
