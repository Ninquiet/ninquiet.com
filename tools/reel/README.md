# Reel studio

Source for `public/media/reel.mp4`, the 60 second "insert coin" reel that plays in the arcade overlay on the home page.

Everything renders in headless Chrome: a canvas draws each frame, `VideoEncoder` and `AudioEncoder` encode H.264 and AAC, and `mp4-muxer` writes the MP4. The soundtrack is synthesized in code with an `OfflineAudioContext` (no samples, no third-party music), so there's nothing to license.

## Files

| File | What it does |
|---|---|
| `studio/timeline.js` | The edit: every segment, its time range, the source clip and where the clip starts. Edit this to re-cut the reel. |
| `studio/music.js` | The soundtrack: 120 BPM, A minor, one style per stage (synthwave, chiptune, techy, boss), synced to the same timeline. |
| `studio/render.js` | Draws the frames (boot screen, stage cards, HUD, glitches, scanlines) and encodes the MP4. |
| `scripts/render.mjs` | Starts a local server and headless Chrome, then renders stills, probes or the full reel. |
| `scripts/fetch-media.mjs` | Copies local assets from the site and downloads the YouTube clips (720p, video only) into `media/`. |
| `scripts/record-site.mjs` | Records the BitDroid gameplay on the home page used in the boss segment into `media/frames/`. |
| `scripts/export-data.mjs` | Writes `src/data/reel.ts` (chapters for the overlay) from the timeline. |

`media/` and `out/` are git-ignored.

## Setup

Needs Node 22+, Google Chrome, and [yt-dlp](https://github.com/yt-dlp/yt-dlp) on the PATH (or set `YT_DLP`). Set `CHROME_PATH` if Chrome is not in the default Windows location.

```bash
cd tools/reel
npm install
npm run media
```

The boss segment needs a site recording in `media/frames/`. `record-site.mjs` drives the BitDroid game through `window.__bitdroid`, which only exists in a build with a temporary debug hook:

1. In `src/components/BitDroid.tsx`, after the game is created, add `(window as unknown as { __bitdroid: Game }).__bitdroid = game;`.
2. Build to a separate folder and serve it on port 4321 (for example `npx astro build --outDir ../reel-dist` and `npx astro preview --outDir ../reel-dist`).
3. Run `npm run record-site`, then remove the hook. Never commit it.

## Render

```bash
npm run stills                              # a few frames to out/stills/
npm run stills -- 7,25.5,43                 # specific times
npm run probe -- "yt720/<id>.mp4@10,12,14"  # look inside a source clip to pick a start time
npm run render                              # out/full/reel.mp4 and reel.wav (about a minute)
```

The full render prints loudness per section, so you can check the mix without listening.

## Publish

```bash
cp out/full/reel.mp4 ../../public/media/reel.mp4
npm run data
```

Run `npm run data` whenever segment times, titles or slugs change, so the overlay's "open project" and chapter map stay in sync with the video. The poster (`public/media/reel-poster.jpg`) is the logo frame, `npm run stills -- 3.6`.

## Notes

- Keep cuts on bar lines (every 2 s at 120 BPM). The music changes style at the same times as the stage cards.
- The portfolio describes professional work generically; don't add employer names or logos to the reel.
