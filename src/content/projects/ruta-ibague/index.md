---
title: "Ruta Ibagué"
date: 2019-03-01
category: games
tags: ["unity", "c#", "android", "geolocation", "ux research"]
summary: "Mobile game-like living map to bring people back to the historic center of Ibagué."
cover: "./ruta-ibague-app.webp"
links:
  - label: "Google Play"
    url: "https://play.google.com/store/apps/details?id=com.ninquiet.rutaIbague&hl=es_CO&gl=US"
legacy: true
---

Ruta Ibagué is a project that was born in the mind of the people of "Cocinas y Saberes Del Centro" as answer to the call "Estimulos" that was made in Ibagué, the project wanted to re-activate the commerce and the tourism in the Historical Center of Ibagué.

The complete project has taken 3 months, 2.5 months of Investigation, and in parallel at the middle of the time entered me as Designer and Developer of the project, having 1.5 months to completely create the application, the complete team was 3 Investigators and me.

The goal of the project was: create an application that can be a living map, with the real mapping of the zone, a very accurate description of what the people will find in every single place, and links to all the social media that has every place, that was wanted to be achieved using a real time map, with geolocation system, like a video game, that shows in real time the nearest places and let to interact with theme.

My first step was to talk with the investigators, to figure it out what was in their minds, and bring it to something achievable, I have asked for other projects like that and what was their inspiration, they told me that like this are other projects in other countries like Argentina and Spain, But that project were too static, no to interactive, so they want something more Dynamic that let the user feel that he is being part.

I noticed that I had two focus users here, my final user and my clients, because they have ideas, but not real sign how to achieve something digital.

To start, I have to talk to theme how they are ordering the information, they told me that in papers, without a specific order, that was a big alarm for me, I told theme that if I can see some theme, and some papers have more information, others less others more, and others different kind information, that was a big problem.

So I started to talk with theme about that, and I asked them as an exercise to try to filter what information could be the most important, measuring every single category, we ended with 10 categories of 32 that were at the beginning.

I asked theme with what technology they were more familiar, what kind of programs they use, the basic suite of Google was their main tool, but, they needed to work in some kind of database that was more structured, that let them undo, and that they can mix with other kind of information wrote, or pictures, a structure not so structured, the answer was an inline database in Notion, with that they can modify everything without have to worries and can work on every single device they wanted, I can create the general Scheme, but they can personalize the information order, and the extra info, and it's a more friendly way that using a big Excel.

![Ruta Ibagué](./captura-de-pantalla-2022-03-27-170436.png)

The same tool worked as exercise to theme, to see what kind of categories were necessary, and what categories mean pretty much the same, just with that tool that we have created, their work have improved.

I started to think, that if they were comfortable with this tool as database, maybe I could connect this database with the application and create the content procedurally.

We have talked about the project, and I started to order the information that they give me in something that I called "modules", I was ordering that modules in a Deck created in Notion too, all the information were in the same page, the inline database, the commentaries, and the deck, so they don't feel lost, and everybody knows where is everything and how the things change through the time.

![Ruta Ibagué](./captura-de-pantalla-2022-03-27-163538.png)

Ended being 130 modules, I created the categories: "investigation", "Prototyping","Debug","Backend","Front-End", and ordered all the modules in those categories, that was made to give an order logical to the information, and a space and time to everything, and that worked too as filter, the 130 modules ended being 75.

With that information, I began to create the first low fidelity prototype:

![Ruta Ibagué](./captura-de-pantalla-2022-03-10-212518.webp)

Before talking with theme about this, they showed me the color palette that they wanted to use in the prototype, and told me that the palette is very important, mostly because the colors where bring to theme from the placeholders that they interviewed, they told me to that the liked the prototype, but they want a calendar too, I added that to the prototype, and added their colors, took my cellphone and has gone to the historical center of Ibagué to interview people with the prototype, the prototype worked as excuse to talk about the project, and to let the people imagine an existing application, that was very helpful, most of all because the people have open to me to say what they liked, what they don't, but most important, what they don't understand.

![Ruta Ibagué](./captura-de-pantalla-2022-03-10-212620.webp)

A curious thing was that most of the people says that thy would like an application like a Pokémon Go would be great, and in the way they used the prototype makes me feel that they needed something more intuitive, I changed in the plan the map, now it's not a top view map, it's a perspective map, and the buildings has to be volumes, the application must be a Pokémon Go like in some aspects.

I decided to create the application using Unity, because I can export the application to multiple platforms.

![Ruta Ibagué](./ruta-ibague-unity.webp)

![Ruta Ibagué](./unnamed-1.webp)

The project was an interactive project, had so many changes along the development, and the time was not a friend, I have connected the Notion Database with a Google Sheets database, and by Script on the sheet and Web Hooks, I do the calls on the application to update the inner database, then that database creates every single place with that information (to locate the places I asked the investigators add in the database every coordinate of every place)

![Ruta Ibagué](./unnamed-2.webp)

After finishing the project, was necessary to create graphic publicity, this publicity ended in the places that are in the same application, giving visibility to the application, and relation between them that before the application doesn't exist.

![Ruta Ibagué](./rutaibague-todos-los-mapas-1.webp)

![Ruta Ibagué](./rutaibague-todos-los-mapas-2.webp)

![Ruta Ibagué](./rutaibague-todos-los-mapas-3.webp)

![Ruta Ibagué](./rutaibague-todos-los-mapas-4.webp)

![Ruta Ibagué](./rutaibague-todos-los-mapas-5.webp)

![Ruta Ibagué](./presentacion-de-la-app-ruta-ibague.jpg)

![Ruta Ibagué](./captura-de-pantalla-2022-03-10-180331.webp)

![Ruta Ibagué](./captura-de-pantalla-2022-03-10-180641.webp)

![Ruta Ibagué](./whatsapp-image-2022-03-10-at-5-56-10-pm-1.webp)
