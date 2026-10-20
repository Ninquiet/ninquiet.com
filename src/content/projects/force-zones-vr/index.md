---
title: "Force zones VR"
date: 2024-11-21
category: xr
tags: ["unity", "vr", "physics"]
summary: "Force zones that pull the player and carry them through the air, combinable into new experiences."
cover: "./image-2024-11-21-013338716.png"
video: "/media/force-zones-vr.webp"
legacy: true
---

Force zones that pull the player in and carry them through the air in a chosen direction.

## Problem

Creators wanted more dynamic ways to move players around their worlds than walking and teleporting.

## Approach

Each zone drags the player inside it and moves them along the air direction. Zones can be combined, so creators can build their own systems out of several of them and create many different experiences.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/oWufqkjh-GM" title="VFX-DEV: Force Zones VR video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

Moving a player without their input is a common cause of motion sickness in VR, so this kind of movement has to stay smooth and predictable to remain comfortable.
