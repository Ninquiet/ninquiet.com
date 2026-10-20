---
title: "Mirror VR"
date: 2024-11-21
category: vfx
tags: ["unity", "vr", "stereo rendering", "cameras"]
summary: "A VR mirror that renders the correct perspective for each eye."
cover: "./image-2024-11-21-015657597.png"
video: "/media/mirror-vr.webp"
legacy: true
---

A working mirror for VR, where you see your own avatar reflected correctly.

## Problem

In VR each eye has a different point of view, so a single reflection texture looks wrong: the mirror has to show each eye its own correct reflection or the image breaks the sense of depth.

## Approach

Most of the work is in code rather than shaders: a camera system calculates the reflected view for each eye and feeds the right image to the mirror surface for that eye.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/rm-tMkqEp4Q" title="VFX-Dev: Mirror VR video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

A mirror means rendering the scene again for the reflection, once per eye, so its cost has to be managed carefully to avoid dropping frames, which in VR directly hurts comfort.
