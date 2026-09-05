import fs from 'fs';
import path from 'path';

const SRC = 'src';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.tsx$/.test(entry.name)) out.push(p);
  }
  return out;
}

const reps = [
  [/text-\[8px\]/g, 'text-[11px]'],
  [/text-\[9px\]/g, 'text-[11px]'],
  [/text-\[10px\]/g, 'text-[11px]'],
  [/#2DD4BF/g, '#0D9488'],
  [/from-\[#2DD4BF\]/g, 'from-[#0D9488]'],
  [/to-\[#5EEAD4\]/g, 'to-[#14B8A6]'],
  [/text-\[#2DD4BF\]/g, 'text-primary'],
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
console.log(`Friendly UX — ${total} files updated.`);
