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
  [/emerald-50/g, 'violet-50'],
  [/emerald-100/g, 'violet-100'],
  [/emerald-200/g, 'violet-200'],
  [/emerald-300/g, 'violet-300'],
  [/emerald-400/g, 'violet-400'],
  [/emerald-500/g, 'violet-500'],
  [/emerald-600/g, 'violet-600'],
  [/emerald-700/g, 'violet-700'],
  [/border-green-600/g, 'border-violet-600'],
  [/focus:border-green-600/g, 'focus:border-violet-600'],
  [/text-green-600/g, 'text-violet-600'],
  [/text-green-700/g, 'text-violet-700'],
  [/bg-green-50/g, 'bg-violet-50'],
  [/bg-green-600/g, 'bg-violet-600'],
  [/from-green-/g, 'from-violet-'],
  [/to-green-/g, 'to-violet-'],
  [/#0D7B3E/gi, '#6366F1'],
  [/#0a6332/gi, '#4338CA'],
  [/#085a2c/gi, '#3730A3'],
  [/#1FAA50/g, '#8B5CF6'],
  [/#1FB68A/g, '#6366F1'],
  [/#1F8FE8/g, '#818CF8'],
  [/#e6f4ea/gi, '#EDE9FE'],
  [/rgba\(13,\s*123,\s*62/g, 'rgba(99, 102, 241'],
  [/13,\s*123,\s*62/g, '99, 102, 241'],
  [/from-teal-200/g, 'from-indigo-200'],
  [/to-teal-200/g, 'to-indigo-200'],
  [/from-emerald-300/g, 'from-violet-400'],
  [/to-emerald-500/g, 'to-violet-500'],
];

let total = 0;
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8');
  let next = content;
  for (const [re, rep] of reps) next = next.replace(re, rep);
  if (next !== content) {
    fs.writeFileSync(file, next);
    console.log('updated', file);
    total++;
  }
}
console.log(`Done — ${total} files updated.`);
