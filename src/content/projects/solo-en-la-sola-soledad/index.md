---
title: "Solo en la Sola Soledad"
date: 2024-11-05
category: games
tags: ["unity", "c#", "3d platformer", "webgl"]
summary: "3D platformer built as UOC master coursework."
cover: "./image-2024-04-28-181111738.png"
video: "/media/solo-en-la-sola-soledad.webp"
links:
  - label: "Play in browser"
    url: "https://simmer.io/@Ninquiet/solo-en-la-sola-soledad-beta"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/NinquietUOC-3D-PEC2"
legacy: true
---

Repository:

[gitlab.com/Ninquiet/NinquietUOC-3D-PEC2](https://gitlab.com/Ninquiet/NinquietUOC-3D-PEC2)

![Game: SOLO EN LA SOLA SOLEDAD](./ext-5381668f63.png)

## Video

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/nOsg76Uqamw" title="Game: SOLO EN LA SOLA SOLEDAD video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## Build

You can play the game here:
[https://simmer.io/@Ninquiet/solo-en-la-sola-soledad-beta](https://simmer.io/@Ninquiet/solo-en-la-sola-soledad-beta)

## Summary

It's a platformer. Move with WASD or the arrow keys, jump with the space bar, and press Esc to open the pause menu.

You can defeat enemies by jumping on them, but if they touch you, you die instantly (it's built so a more complex health system can be added in the future).

## How it works

![Game: SOLO EN LA SOLA SOLEDAD](./ext-9ae84cca2d.png)

I built it with scalability in mind, so I created a basic state machine that works for every character (both enemies and the player count as characters), with each one providing its own implementation. For example, the player's movement is driven by input (I used Unity's new Input System for this), while the enemies' movement is driven by triggers that detect the player.

![Game: SOLO EN LA SOLA SOLEDAD](./ext-ab879704b3.png)

The state machine is hierarchical. It first transitions between root states such as Grounded, Jump, and Airborne. When entered, these states assign second-level sub-states based on the variables in the context (the context being the state machine itself). Those sub-states can in turn assign their own sub-states, which is why some of them assign the HorizontalMovement sub-state.

![Game: SOLO EN LA SOLA SOLEDAD](./ext-7f95e4d4b3.png)

The rest is quite simple: the player and each enemy create their own variants of the base state machine with their own implementations. The idea was for them to also create their own sub-states and state factory, but in the end that wasn't necessary (the structure is still there so the project can scale in the future).

![Game: SOLO EN LA SOLA SOLEDAD](./ext-51d88b5580.png)

![Game: SOLO EN LA SOLA SOLEDAD](./ext-72881a2331.png)

For animation I created a class called "CharacterAnimationController.cs", which the state machine's states control by sending it different changes for the Animator. The Animator uses sub-states to handle the character's actions in the air and on the ground (for the enemies I used a copy of the same Animator with the enemy's animations).

For the level I used a Tilemap with a dynamic tile I created, which I used throughout the entire level.

## Assets used

[DoTween](https://assetstore.unity.com/packages/tools/animation/dotween-hotween-v2-27676)
For quick transitions.

Cinemachine
For controlling camera movement.

[Kenney 1-Bit Asset](https://kenney.nl/assets/1-bit-platformer-pack)
I used this texture to create all the sprites in the game.
