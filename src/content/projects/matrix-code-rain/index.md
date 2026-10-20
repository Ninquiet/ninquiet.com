---
title: "Matrix code rain"
date: 2025-10-07
category: vfx
tags: ["shader graph", "single shader"]
summary: "A Matrix-style code rain built in a single shader, step by step."
cover: "./image-2025-10-07-142444347.png"
video: "/media/matrix-code-rain.webp"
legacy: true
featured: true
order: 2
---

A Matrix-style "code rain" effect built in a single shader.

## Problem

The goal was the feeling of training inside the Matrix: endless columns of changing characters falling around you, without simulating thousands of individual characters.

## Approach

For the random changing characters, I created a texture of random symbols laid out on a grid with even spacing.

![VFX - Matrix Code Rain](./image-1.png)

Then, by adding a constant offset on Y and nudging X by fixed steps (a floor node keeps the values snapped), I got characters that change over time:

![VFX - Matrix Code Rain](./image-2.png)

Next, I made a simple texture of falling lines with an especially bright tip, and tiled it into an infinite pattern.

![VFX - Matrix Code Rain](./image-3.png)

Reusing some of the logic from before, I added movement:

![VFX - Matrix Code Rain](./image.png)

Multiplying both effects gives the base. From there I added extra passes, combined them, and faded the top and bottom of the shape smoothly.

![VFX - Matrix Code Rain](./image-5.png)

Finally, everything is multiplied by a color before output.

![VFX - Matrix Code Rain](./image-6.png)

The last step is a mesh with inverted faces that fits the infinite-top look without visual breaks from culling.

![VFX - Matrix Code Rain](./image-7.png)

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/ro8pqshcnUw" title="VFX - Matrix Code Rain video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## Performance

Everything happens in one shader on a single mesh, with no particles or per-character objects, which keeps the effect cheap enough to surround the player.
