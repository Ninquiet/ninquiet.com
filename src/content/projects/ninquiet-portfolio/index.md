---
title: "ninquiet.com"
date: 2026-10-19
category: tools
tags: ["astro", "react", "typescript", "canvas", "game ai", "procedural animation"]
summary: "This very site: a creative-hacker portfolio where the page itself becomes a platformer level."
cover: "./cover.jpg"
video: "/media/ninquiet-portfolio.webp"
license: "PolyForm Noncommercial (code), all rights reserved (content)"
featured: true
links:
  - label: "GitHub"
    url: "https://github.com/Ninquiet/ninquiet.com"
  - label: "Live site"
    url: "https://ninquiet.com"
---

My portfolio, rebuilt from an old WordPress site into a static Astro + React site deployed on GitHub Pages. It is also a playground: click the little robot on top of my name and the page turns into a game.

## The page is the level

**BitDroid**, a pixel art robot, idles on my name: it looks around, blinks, breathes, follows the cursor, and hops with squash and stretch. Clicking it starts a platformer where the real DOM is the level: project cards, card sections, prompts, and the git log become one-way platforms, with coyote time, jump buffering, a double jump, and a camera that scrolls the page. Collect a star above every card to win. A synthwave city fades in behind the content with parallax layers that react to the camera.

## Three flavors of game AI

- **Bugs** use platforming AI: they pick a reachable ledge, climb, drop through platforms, or leap gaps, and show their intent and target ledge on screen.
- **Watcher drones** use steering behaviors: they patrol with arrive and wander, go on alert, pursue with velocity prediction, return home when they lose you, and flee from the cursor outside the game. Their detection radius, velocity, and predicted point are drawn live.
- **The spider boss** is fully procedural: six two-bone IK legs reach for the nearest edges of page elements and step in a tripod gait, so the body only moves as far as its grip allows. It takes three hits, changing color and speeding up each time.

Click or tap any enemy to zap it; explosions chain to nearby enemies and knock project cards off their hooks.

## The rest

An interactive terminal hero, a generative glyph background, pixel art cards that charge up on hover, hover backdrops that jump in, a scroll glitch on the viewport edges, pixel block page transitions, and touch controls for mobile. The code is written in TypeScript with small, single-purpose modules for physics, input, steering, IK, effects, and audio.
