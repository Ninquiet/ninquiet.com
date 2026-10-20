---
title: "Buy effect"
date: 2024-11-21
category: vfx
tags: ["shaders", "vfx graph", "user generated content"]
summary: "A purchase effect that adapts to any community-uploaded object or avatar, whatever its materials."
cover: "./image-2024-11-21-011018703.png"
video: "/media/buy-effect.webp"
legacy: true
featured: true
order: 3
---

A purchase effect that plays on any item or avatar a user buys, without touching the original object.

## Problem

The community can upload any avatar or object, each with its own custom shaders and materials. The effect had to work on all of them and run on a copy, never destroying or modifying the original.

## Approach

The effect duplicates the target and builds itself procedurally around that copy, adapting to each object's shape and materials instead of relying on hand-made versions per item.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/KvMahG42MJM" title="VFX: Buy Effect video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

Here it is applied to different kinds of objects:

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/xS5fnR28EHM" title="VFX: Buy Effect video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

Because the input is unpredictable user-generated content, the effect has to stay robust and affordable on objects of very different complexity, so it can play in a crowded VR scene without hurting performance.
