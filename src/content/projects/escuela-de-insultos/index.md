---
title: "Escapa de la Escuela de Insultos"
date: 2024-11-05
category: games
tags: ["unity", "c#", "2d", "dialogue system", "webgl"]
summary: "Insult sword-fighting adventure inspired by Monkey Island, with a modular code core."
cover: "./image-2024-03-31-153453516.png"
video: "/media/escuela-de-insultos.webp"
links:
  - label: "Play in browser"
    url: "https://simmer.io/@Ninquiet/escapa-de-la-escuela-de-insultos"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1/-/wikis/uploads/f144651d6fb527a2fadd7efccd2ca767/image.png"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1/-/wikis/uploads/86f96f9146028758f01fd17c6127a9fe/image.png"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1/-/wikis/uploads/466a8c3f17169540c6bf518d8440a9a5/image.png"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1/-/wikis/uploads/e3a496f429e45468c449f07d6e798fb9/Diagrama_Pec_1_2d.jpg"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1/-/wikis/uploads/c787f32f46e7fab98b04bd10796d6562/image.png"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1/-/wikis/uploads/d6d61e0736f5a670b998386c0c8b99b2/image.png"
  - label: "Repository"
    url: "https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1/-/wikis/uploads/fc246c1a9723443efad7354352fb2b75/image.png"
legacy: true
---

Repositorio: https://gitlab.com/Ninquiet/ninquietuoc-2d-pec1

![Game: Escapa de la Escuela de Insultos](./ext-256d83715a.png)

## Tabla de Contenidos

- [Juego En WebGl](#juego-en-webgl)

- [Resumen](#resumen)

[Mecánicas](#mecanicas)

- [Movimiento por los escenarios](#movimiento-por-los-escenarios)

- [Batallas de Insultos](#batallas-de-insultos)

[Estructura Lógica del Código](#estructura-logica-del-codigo)

- [Forma en que escribí el código](#forma-en-que-escribí-el-codigo)

- [Librerías externas](#librerías-externas)

- [Estructura](#estructura)

- [Núcleo Base](#núcleo-base)

- [Núcleo Story](#núcleo-story)

- [Núcleo InsultsBattle](#núcleo-insultsbattle)

- [Ilustraciones](#ilustraciones)

## Video del juego

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/vO3QHNyNFLE" title="Game: Escapa de la Escuela de Insultos video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## Juego En WebGl

Para jugar, visita el siguiente enlace: [Juega "Escapa de la Escuela de Insultos" aquí](https://simmer.io/@Ninquiet/escapa-de-la-escuela-de-insultos)

## Resumen

Este es un juego que toma como base las batallas de insultos en Monkey Island, donde el contrincante te insultará, tu tomarás una alternativa y según esto responderás bien o no a su ataque y será tu turno de atacarlo a el.

## Mecanicas

El juego combina el movimiento por los escenarios con elecciónes, con las batallas de insultos, de esta manera en cada escenario hay algo que encontrar o algún enemigo que vencer para poder continuar.

### Movimiento por los escenarios

![Game: Escapa de la Escuela de Insultos](./ext-a1262942cb.png)

Los escenarios son un papel fundamental en el juego, para moverte atraves de ellos solo debes oprimir el botón de tu escenario objetivo, estos son tu medio para moverte a lo largo del juego, en algunos encontrarás por ejemplo una llave, en muchos otros encontraras diversos enemigos que solo se encuentran en estos lugares, debes sortear los diferentes escenarios para poder llegar a la puerta con la llave y escapar.

### Batallas de Insultos

![Game: Escapa de la Escuela de Insultos](./ext-9111cdf2d8.png)

En las batallas de insultos el enemigo iniciará el ataque, eligiendo de forma aleatoria un insulto, y el jugador deberá elegir la respuesta correcta entre tres posibilidades, si el jugador elige correctamente el ataque enemigo no tendrá efecto, sin embargo, si se equivoca, el ataque enemigo dañará al jugador.

Luego de esto, será el turno del jugador para insultar a su enemigo, entonces, el jugador elegirá un insulto de las posibilidades mostradas (elegidas de forma aleatoria de la lista de insultos), y el enemigo deberá tratar de responder el insulto con la respuesta correcta.

## Estructura Logica del Codigo

### Forma en que escribí el codigo:

El codigo está escrito con la intención de implementar el Self Comment Code (trato de seguir los lineamientos del libro Clean Code), tambien he escrito el codigo en inglés (a excepción de las partes relacionadas a algo que se vaya a mostrar al usuario, cómo dialogos o textos) esto debido a que es una convención estandar internacional hacerlo así (espero no haya problema).

Inicialmente cree el codigo para funcionar con el sistema de Task de C#, pero al finalizar el juego y exportarlo a WebGl, descubrí que WebGl no trabaja muy bien (por no decir que para nada) con los Delay temporales, por lo tanto me vi obligado a buscar alternativas, así que, uso ampliamente DoTween (librería gratuita) y UniTask (librería gratuita tambien)

### Librerias externas:

[**DoTween**](https://dotween.demigiant.com)

He usado DoTween principalmente para gestionar animaciones simples, no soy muy fan de usar Animator para cosas simples, más que todo por su gran consumo en performance.

[**UniTask**](https://dotween.demigiant.com)

Unitask es similar al sistema de Task de c#, pero optimizado para funcionar con Unity, así que gracias a el pude solucionar los problemas con Delay en web sin necesidad de cambiar todo el proyecto.

### Estructura

![Game: Escapa de la Escuela de Insultos](./ext-5303250b1c.jpg)

Tomé como base el juego de aventuras, pues quería crear un juego en que no fuera solo una batalla sino una pequeña aventura, sin embargo lo modifiqué bastante (tal vez ahora sea un paralelo muy lejano), esta estructura de modo Historia se nutre en tiempo real del documento **Story** ubicado al interior de la carpeta **Resources**

### Nucleo Base:

Este nucleo estaría compuesto por los Scripts generales y de control, (Los que se pueden encontar en "/Scripts"), su principal exponente es **GameplayManager**, no es un script muy largo, pero su funcion es iniciar el juego y hacer de puente entre los distintos eventos que suceden, así conecta el modo historia con las batallas de insultos, y viceversa.

### Nucleo Story:

![Game: Escapa de la Escuela de Insultos](./ext-8eb337c81c.png)

El nucleo Story se compone por todos los Scripts al interior de **"/Scripts/Story"**, el manejador principal es **StoryGameplayManager**, este se encarga de gestionar la historia y su loop. Cuando se inicializa, hace uso de **StoryManager** para traducir la información del Json Story a nodos, luego de esto inicia el texto y las opciones, para mostrar el texto usa **StoryUIManager** que es el encargado de todo los UI correspondiente a Story, para interconectar todo hago uso de un sistema de Acciones a modo de evento.

Cuando el modulo Story se encuentra que en el escenario en el que se encuentra el jugador hay un Enemigo, notifica a GameplayManager que hay un enemigo y que tipo de enemigo es, GameplayManager usa "UIManager" para activar la interfaz de batalla y notifica a "InsultsBattleManager" para que inicialize la batalla con el enemigo indicado.

Una vez que la batalla finaliza, GameplayManager notifica a StoryGameplayManager y este continua con el modo historia.

### Nucleo InsultsBattle

![Game: Escapa de la Escuela de Insultos](./ext-6b613c4d9b.png)

Este nucleo se encarga de gestionar todo lo relacionado con batallas, se le notifica que enemigo es el con el cual se batallará, y este se encarga de organizar todo lo relacionado a inciar el enemigo, y controlar la interfaz con ayuda de "StoryUIManager", si el jugador muere se notifica la derrota a GameplayManager y este activa la pantalla derrota, por el contrario, si el jugador gana, tambien se notifica a GameplayManager y este cierra el modo batalla y continua con el modo historia.

Los insultos son cargados del archivo **TestingInsults** en la carpeta /Resources, el encargado de deserializar estos archivos y convertirlo a los DTO y posteriormente a los formatos de clases finales es **Insults Manager**

## Ilustraciones

![Game: Escapa de la Escuela de Insultos](./ext-b7b9326243.png)

Las ilustraciones las he hecho yo, no son muy bonitas pero fueron hechas con mucho amor <3
