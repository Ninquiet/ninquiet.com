---
title: "World spheres"
date: 2024-11-21
category: vfx
tags: ["shaders", "vfx graph", "vr"]
summary: "World spheres that react differently when you are far, close, or inside them."
cover: "./image-2024-11-21-011600052.png"
video: "/media/world-spheres.webp"
legacy: true
---

Interactive spheres that represent worlds, built by mixing shaders, VFX Graph, and custom code.

## Problem

The spheres had to work as both a preview and a doorway: interesting from far away, informative up close, and convincing when you are inside one.

## Approach

Each sphere changes its behavior depending on the player's distance: one look when far, another when close, and a different one when inside, combining shaders, VFX Graph, and code to switch between states.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/6Qh3OYzmqDA" title="VFX: World Spheres video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

Several spheres can be visible at once, so the distance-based states also work as a way to keep detailed effects only where the player is looking closely, keeping the scene light in VR.
