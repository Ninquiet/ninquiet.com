---
title: "Splash logo animation"
date: 2024-11-21
category: vfx
tags: ["shaders", "vfx graph", "timeline", "dotween"]
summary: "Intro splash screen animation with custom shaders, VFX Graph, and Timeline."
cover: "./image-2024-11-21-014322066.png"
video: "/media/splash-logo-animation.webp"
legacy: true
featured: true
order: 5
---

The intro animation that plays as the splash screen.

## Problem

The splash screen is the first thing people see, so it had to feel polished and on brand instead of a static logo.

## Approach

Custom shaders and VFX Graph build the visual layers, and Timeline plus DoTween choreograph the timing of the whole sequence.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/kMRJZHad1RA" title="VFX: Splash Logo Animation video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

It plays while the app is starting, so it has to look good without demanding much from the GPU, and in VR it needs to stay comfortable to watch.
