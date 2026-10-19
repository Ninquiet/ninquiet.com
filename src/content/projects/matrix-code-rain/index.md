---
title: "Matrix code rain"
date: 2025-10-07
category: vfx
tags: ["shader graph", "single shader"]
summary: "A Matrix-style code rain built in a single shader, step by step."
cover: "./image-2025-10-07-142444347.png"
featured: true
legacy: true
---

Here is a little preview of an effect created to give the feeling of matrix trainning code, is a single shader

For the random changing text, I've created a texture with random text, organized on a grid with perfect distnaces between each other

![VFX - Matrix Code Rain](./image-1.png)

Then, by adding a constant offset on Y, and moving a little X on fixed values (using floor node to keep the values fixed) I was able to have a changing letters effect:

![VFX - Matrix Code Rain](./image-2.png)

Then, I've created simple texture of falling lines, where the tip is specially bright, and tilled them making them an inffinite pattern

![VFX - Matrix Code Rain](./image-3.png)

And using some of the already calculated logic before, I added some movement

![VFX - Matrix Code Rain](./image.png)

Then after multiplying both effects, we have the perfect base:

Now we just need to add some extra passes, combine them, and create a smooth fading on top and bottom of the sahep

![VFX - Matrix Code Rain](./image-5.png)

And multiply by a color before output the value

![VFX - Matrix Code Rain](./image-6.png)

So we have this at the end

Now we just need to create a mesh with inverted faces, that fits with the effect of infinite top, but without breaking visually because the culling, and we are done

![VFX - Matrix Code Rain](./image-7.png)

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/ro8pqshcnUw" title="VFX - Matrix Code Rain video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>
