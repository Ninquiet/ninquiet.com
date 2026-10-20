---
title: "Non-VR movement system"
date: 2024-11-21
category: xr
tags: ["unity", "animation", "mocap", "character controller"]
summary: "First and third person movement for people without a headset, with animations I recorded myself."
cover: "./image-2024-11-21-014713166.png"
video: "/media/non-vr-movement.webp"
legacy: true
---

A movement system for people joining a VR world without a headset, with first and third person views.

## Problem

Not everyone in a VR world has a headset. Desktop users needed to move and look natural next to VR users.

## Approach

I recorded myself to create each animation, then built the animators and all the code for the controller. Players can switch easily between first person and third person.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/91EX84yVOLI" title="Dev: Non-VR Movement system video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

Desktop and VR players share the same world, so desktop avatars have to move in a way that looks natural to VR users around them.
