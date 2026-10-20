---
title: "Portals"
date: 2024-11-21
category: vfx
tags: ["unity", "render textures", "shaders", "vr"]
summary: "A portal system that connects a whole metaverse, built on a multi-camera rendering setup."
cover: "./image-2024-11-21-012132353.png"
video: "/media/portals.webp"
legacy: true
featured: true
order: 6
---

A portal system that connects the different worlds of a metaverse: you see the destination through the portal in real time and step through it to travel.

## Problem

Players needed to move between worlds without a loading screen breaking immersion, and the portal had to look like a real window into the other place, not a flat picture.

## Approach

A multi-camera setup renders the destination view from the right position into a texture shown on the portal surface. Custom shaders and VFX dress the frame, and the player is teleported once they cross the portal under the right conditions.

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/2QOjH1y26Dw" title="VFX-DEV: Portals video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## VR constraints

Every portal is an extra camera render, and in VR the view also has to look right for each eye, so the number of active views and their resolution must stay under control to keep the frame rate stable.

This is the first version of the portals I built:

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/8T9byXMk9yc" title="VFX-DEV: Portals video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>
