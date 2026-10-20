---
title: "Hover Bikes fire effect"
date: 2024-11-21
category: vfx
tags: ["hlsl", "vfx graph", "vertex displacement"]
summary: "Rocket flame for the Somnium Space hover bikes, with custom HLSL shaders, heat distortion, and dust."
cover: "./screenshot-2024-11-20-131521.png"
video: "/media/hover-bikes-fire.webp"
links:
  - label: "Post on X"
    url: "https://twitter.com/i/status/1854975117270438149"
legacy: true
featured: true
order: 4
---

I recreated the rocket flame for the Somnium Space hover bikes, making it feel energetic and powerful.

## Problem

The old exhaust effect felt flat. The bikes needed a flame with real movement, plus the dust and heat haze you would expect from a rocket engine, all readable from up close and while the bike is moving.

## Approach

Custom HLSL/CG shaders in Unity drive the flame look and movement, with vertex displacement to make it pulse and stretch. A separate VFX Graph effect adds the dust and the heat distortion.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/NOSlHRmX7gs" title="VFX/ Hover Bikes Fire Effect video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

[twitter.com/i/status/1854975117270438149](https://twitter.com/i/status/1854975117270438149)

## VR constraints

Transparent, layered effects like flames and heat distortion overlap a lot of pixels, so they have to stay lean on overdraw and particle count to hold the frame rate in a social VR world.
