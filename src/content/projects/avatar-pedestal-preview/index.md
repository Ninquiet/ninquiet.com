---
title: "Avatar pedestal preview"
date: 2024-11-21
category: xr
tags: ["unity", "avatars", "colliders"]
summary: "A pedestal to preview and spawn avatars, calculating colliders in real time."
cover: "./image-2024-11-21-012928570.png"
video: "/media/avatar-pedestal-preview.webp"
legacy: true
---

A pedestal to preview avatars and spawn them into the world.

## Problem

Users needed to see an avatar before using it, and spawning an avatar of unknown shape needed correct collisions so it would behave properly in the world.

## Approach

The pedestal shows a preview of the avatar and calculates its colliders in real time when spawning it, along with the other setup it needs.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/qyRlhHu1_qE" title="VFX-DEV: Avatar Pedestal Preview video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

Avatars come in all shapes and sizes, so the collider calculation has to handle that variety at runtime without hiccups in a live VR session.
