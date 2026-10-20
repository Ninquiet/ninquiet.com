---
title: "Tech dissolve"
date: 2024-11-21
category: vfx
tags: ["shaders", "ui", "real-time"]
summary: "A dissolve system that adapts in real time to meshes and UI alike."
cover: "./screenshot-2024-11-21-020206.png"
video: "/media/tech-dissolve.webp"
legacy: true
---

More than a single effect, this is a dissolve system that adapts in real time to whatever it is applied to.

## Problem

The dissolve had to work not only on 3D meshes but also on UI, so the same visual language could be used for objects and interface elements alike.

## Approach

The system adapts to the content at runtime, so the same dissolve can be driven on meshes and on UI without building a separate version for each case.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/TQmGO0wJXqM" title="VFX-Dev: Tech-Dissolve video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

UI in VR lives in world space, so the dissolve has to read well on panels in 3D, not just on a flat screen.
