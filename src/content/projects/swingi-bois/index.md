---
title: "Swingi Bois Beta"
date: 2026-10-20
category: games
tags: ["vr", "meta quest", "multiplayer", "physics", "procedural generation"]
summary: "A multiplayer VR game about elastic arms: launch your hands, grab, swing, inflate, and fling yourself across procedurally generated arenas."
cover: "./cover.jpg"
video: "/media/swingi-bois.webp"
version: "beta"
featured: true
order: 0
---

**Swingi Bois** is a multiplayer VR game I'm building to explore one question: what can you do in virtual reality when your arms are elastic? It's currently in beta on Meta Quest.

<video src="/media/swingi-bois-gameplay.mp4" controls muted loop playsinline preload="metadata" data-autoplay></video>

## How it plays

You launch your arms, grab onto platforms, and swing to build momentum, then use that momentum to reach and catch other players. You can also inflate your hands and fire yourself through the air.

The core mechanics are deliberately few. The depth comes from combining them: a swing that turns into a launch, a grab in mid-flight, an inflated escape at the last second. Each arena is generated procedurally, so the same moves keep finding new uses, and several game modes are built on top of the same movement.

## Challenges

### Multiplayer

Movement is fast and fully physics-driven. Players fling themselves across the map and grab each other in mid-air, so every player needs to see the same moment at the same time, or a catch stops feeling fair.

### A platform as limited as Quest

The game runs standalone on Meta Quest, which means mobile hardware that still has to hold a high, stable frame rate to stay comfortable in VR. Physics, stretching arms, and several players all compete for that budget.

### Physics for an impossible body

No real body has arms that stretch or hands that inflate. The physics still have to feel believable and controllable: elastic enough to be fun, stable enough that players trust them, and smooth enough to stay comfortable in a headset.

### Level design for a movement system this unusual

Movement this singular changes what a good level is, and on top of that the levels are procedural. So instead of building finished levels, I designed individual platforms and spaces, evaluated what each one makes possible, and studied how they interact with each other. The generator then combines those pieces into levels that create fluid experiences and stay fair for every player.
