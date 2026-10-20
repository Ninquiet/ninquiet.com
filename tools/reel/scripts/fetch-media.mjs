import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEGMENTS } from '../studio/timeline.js';

const tool = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(tool, '../..');
const media = path.join(tool, 'media');
fs.mkdirSync(path.join(media, 'yt720'), { recursive: true });
fs.mkdirSync(path.join(media, 'assets'), { recursive: true });

const local = {
  'assets/jelly-shader.mp4': 'public/media/jelly-shader.mp4',
  'assets/tinyagentoffice.mp4': 'public/media/tinyagentoffice.mp4',
  'assets/canvas-bend-points.mp4': 'public/media/canvas-bend-points.mp4',
  'assets/gpts.jpg': 'src/content/projects/custom-gpts/cover.jpg',
  'assets/unity-essentials.jpg': 'src/content/projects/unity-essentials/cover.jpg',
};
for (const [to, from] of Object.entries(local)) fs.copyFileSync(path.join(repo, from), path.join(media, to));

const ids = [...new Set(SEGMENTS.map((s) => s.src?.match(/^yt720\/(.+)\.mp4$/)?.[1]).filter(Boolean))];
for (const id of ids) {
  const file = path.join(media, 'yt720', `${id}.mp4`);
  if (fs.existsSync(file)) continue;
  console.log('downloading', id);
  execFileSync(process.env.YT_DLP ?? 'yt-dlp', ['-q', '-f', 'bv[height<=720][vcodec^=avc1][ext=mp4]/bv[height<=720][ext=mp4]', '-o', file, `https://youtu.be/${id}`], { stdio: 'inherit' });
}
console.log('media ready in', media);
