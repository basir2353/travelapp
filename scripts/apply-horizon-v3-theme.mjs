import fs from 'fs';
import path from 'path';

const SRC = 'src';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const reps = [
  [/shadow-aurora-lg/g, 'shadow-horizon-lg'],
  [/shadow-aurora/g, 'shadow-horizon'],
  [/violet-700/g, 'teal-700'],
  [/violet-600/g, 'teal-600'],
  [/violet-500/g, 'teal-500'],
  [/violet-400/g, 'cyan-400'],
  [/violet-300/g, 'cyan-300'],
  [/violet-200/g, 'teal-200'],
  [/violet-100/g, 'teal-100'],
  [/violet-50/g, 'teal-50'],
  [/indigo-400/g, 'sky-400'],
  [/indigo-200/g, 'sky-200'],
  [/indigo-100/g, 'teal-100'],
  [/indigo-50/g, 'orange-50'],
  [/rose-300/g, 'orange-300'],
  [/rose-50/g, 'orange-50'],
  [/purple-900/g, 'teal-900'],
  [/purple-800/g, 'teal-800'],
  [/purple-700/g, 'teal-700'],
  [/purple-600/g, 'teal-600'],
  [/purple-500/g, 'teal-500'],
  [/purple-200/g, 'teal-200'],
  [/purple-100/g, 'teal-100'],
  [/purple-50/g, 'teal-50'],
  [/#7C3AED/gi, '#14B8A6'],
  [/#4F46E5/gi, '#0F766E'],
  [/#6366F1/gi, '#0D9488'],
  [/#4338CA/gi, '#115E59'],
  [/#3730A3/gi, '#134E4A'],
  [/#8B5CF6/g, '#2DD4BF'],
  [/#818CF8/g, '#5EEAD4'],
  [/#EDE9FE/gi, '#CCFBF1'],
  [/rgba\(99,\s*102,\s*241/g, 'rgba(13, 148, 136'],
  [/99,\s*102,\s*241/g, '13, 148, 136'],
  [/139,\s*92,\s*246/g, '20, 184, 166'],
  [/244,\s*63,\s*94/g, '249, 115, 22'],
  [/Aurora V2/g, 'Horizon V3'],
  [/THEME v2 — Aurora/g, 'THEME v3 — Horizon'],
];

let total = 0;
for (const file of walk(SRC)) {
  if (file.includes('lib\\theme.ts') || file.includes('lib/theme.ts')) continue;
  let content = fs.readFileSync(file, 'utf8');
  let next = content;
  for (const [re, rep] of reps) next = next.replace(re, rep);
  if (next !== content) {
    fs.writeFileSync(file, next);
    console.log('updated', file);
    total++;
  }
}
console.log(`Horizon V3 — ${total} files updated.`);
