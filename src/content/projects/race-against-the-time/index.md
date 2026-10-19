---
title: "Race Against the Time"
date: 2024-11-21
category: games
tags: ["unity", "c#", "racing", "ghost replay", "webgl"]
summary: "Racing game where you compete against your own ghost. Every asset made by me."
cover: "./68747470733a2f2f692e6962622e636f2f354d516348644e2f696d616765.png"
links:
  - label: "Play in browser"
    url: "https://simmer.io/@Ninquiet/carrera-contra-reloj-v1-pec1"
legacy: true
---

![Game: Race Against the time](./ext-b665b48639.png)

## Video:

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/yhKHteLQ37M" title="Game: Race Against the time video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## Build:

Puedes jugar el juego acá:
[https://simmer.io/@Ninquiet/carrera-contra-reloj-v1-pec1](https://simmer.io/@Ninquiet/carrera-contra-reloj-v1-pec1)

## Resumen:

Es un juego de carreras en el qué puedes correr contra ti mismo, el funcionamiento es simple, solo necesitas las WASD para moverte, y Space Bar para frenar

**Todos los Assets los he creado yo, las texturas las hice con photoshop y el personaje lo cree con primitvas**

Cree tambien mi propio sistema para grabar y reproducir las grabaciones (es una version personalizada :3 )

## Funcionamiento:

![Game: Race Against the time](./ext-eff55df9f2.png)

### Game:

El principal es GamePlayeControl (que se encarga de organizar el inicio transicion y final de la partida), luego está GameUIController (que controla todo lo relacionado a UI), y por ultimo GameTrigger, que es el componente usado para tener un tracking de cuando el usuario pasa pro ciertas parrtes o no).

### CarControl:

Compuesto de CarController.cs, es el que se encarga del movimiento del carro (lo he personalizado un poco)

### CarRecord:

Compuesto de CarRecordData (Serializable donde se guarda la informacion) CarRecordManager (que es el que gestiona cuando grabar y cuando reproducir) RecordLogger (encargado de grabar lo snapshots) RecordPlayer (encargado de reproducir los snapshots), y RecordModuleBase, que es la clase abstracta base para el logger y el RecordPlayer

### CameraDirector:

Compuesto unicamente por GameCameraDirector.cs es el encargado de controlar que tipo de camara se usará, así, cuando el juego termina, este al estar conectado con un evento en GameplayControl es notificado, y empieza a cambiar entre diferentes camaras. para esto he usado CineMachine para tener un mejor acabado

## Assets usados:

[Free Trees](https://assetstore.unity.com/packages/3d/vegetation/trees/free-trees-103208)
Para agregar arboles (debido a que estoy usando URP)

[DoTween](https://assetstore.unity.com/packages/tools/animation/dotween-hotween-v2-27676)
Para hacer transiciones rapidamente.
