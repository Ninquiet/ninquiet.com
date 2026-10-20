---
title: "Spawn / unspawn worlds"
date: 2024-11-21
category: vfx
tags: ["shaders", "vfx graph", "dotween", "urp", "single pass"]
summary: "Appear and disappear effect for world spheres, made for VR on URP single pass."
cover: "./image-2024-11-21-010417549.png"
video: "/media/spawn-unspawn-worlds.webp"
legacy: true
---

The effect that plays when the world spheres appear and disappear.

## Problem

Spheres popping in and out felt abrupt. They needed a clear, satisfying transition that tells the player something is being created or removed.

## Approach

A mix of custom shaders, VFX Graph, and DoTween animations choreographs the appear and disappear sequence.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/pjUctyUWRG4" title="VFX: Spawn-Unpawn Worlds video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

Built specifically for VR on URP with Single Pass rendering, so the shaders and particles had to be compatible with single pass stereo and render correctly in both eyes in one pass.
