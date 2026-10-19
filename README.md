# ninquiet.com

Personal portfolio of Jesús David Angarita. Astro + React islands, deployed to GitHub Pages.

## Commands

| Command           | Action                                  |
| :---------------- | :-------------------------------------- |
| `npm install`     | Install dependencies                    |
| `npm run dev`     | Dev server at `localhost:4321`          |
| `npm run build`   | Build the static site to `./dist/`      |
| `npm run preview` | Preview the production build locally    |

## Structure

```text
src/
├── content/projects/<slug>/index.md   one folder per project, images next to the markdown
├── content.config.ts                  project schema
├── data/                              profile, career log, categories
├── components/                        Terminal, GlyphBackground, PaletteSwitcher (React) + Astro cards
├── lib/terminal/                      command registry, shell (parse, complete), types
├── lib/glyphField.ts                  generative hero background renderer
└── pages/                             home, /projects/, /projects/<slug>/, 404
```

## Adding a project

Create `src/content/projects/<slug>/index.md`:

```md
---
title: "My project"
date: 2026-10-19
category: games        # agents | tools | xr | games | ui-ux | web | branding | motion | art
tags: ["unity", "c#"]
summary: "One line that sells it."
cover: "./cover.webp"  # optional, lives in the same folder
featured: true         # shows on the home page
links:
  - label: "GitHub"
    url: "https://github.com/Ninquiet/..."
---

Body in markdown. Images: ![alt](./shot.webp)
```

The terminal (`ls`, `open <slug>`) picks it up automatically.

## Adding a terminal command

Add a `Command` object to `src/lib/terminal/commands.ts` and append it to `COMMANDS`.

## Deploy

1. Push to a GitHub repo, branch `main`.
2. Repo settings → Pages → Source: **GitHub Actions**.
3. `public/CNAME` already points to `ninquiet.com`. At the DNS provider:
   - `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www`: `ninquiet.github.io`
4. Back in Pages settings, enable **Enforce HTTPS** once the certificate is issued.
