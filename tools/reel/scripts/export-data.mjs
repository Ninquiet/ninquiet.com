import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEGMENTS, DURATION } from '../studio/timeline.js';

const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../src/data/reel.ts');
const stageOf = (s) => (s.kind === 'boot' ? 0 : s.kind === 'warning' || s.kind === 'site' ? 4 : s.kind === 'continue' ? 5 : s.stage);
const rows = SEGMENTS.map((s) => {
  const fields = [`start: ${s.start}`, `end: ${s.end}`, `stage: ${stageOf(s)}`];
  if (s.slug) fields.push(`slug: '${s.slug}'`, `title: '${s.title}'`);
  return `    { ${fields.join(', ')} },`;
});
const out = `export const REEL_EVENT = 'reel:open';

export interface ReelChapter {
  start: number;
  end: number;
  stage: number;
  slug?: string;
  title?: string;
}

export const REEL = {
  src: '/media/reel.mp4',
  poster: '/media/reel-poster.jpg',
  duration: ${DURATION},
  chapters: [
${rows.join('\n')}
  ] satisfies ReelChapter[],
};
`;
fs.writeFileSync(target, out);
console.log('wrote', target);
