---
title: "Invasión Alienígena"
date: 2024-11-05
category: games
tags: ["unity", "c#", "platformer", "webgl", "android"]
summary: "Platformer where you fight an alien invasion, built as UOC master coursework."
cover: "./image-2024-11-05-164255163.png"
video: "/media/invasion-alienigena.webp"
links:
  - label: "Play in browser"
    url: "https://simmer.io/@Ninquiet/invasionalienigena"
  - label: "Android APK"
    url: "https://drive.google.com/file/d/1WEzU8jH1y8nZuNBp5wpDoEjlWRb_Wts-/view?usp=sharing"
legacy: true
featured: true
order: 2
---

## Video:

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/PQEoYr7PsSE" title="Game Test: INVASION ALIENIGENA video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" loading="lazy"></iframe></div>

## Build:

Puedes jugar el juego acá:
[https://simmer.io/@Ninquiet/invasionalienigena](https://simmer.io/@Ninquiet/invasionalienigena)

Android APK:
[https://drive.google.com/file/d/1WEzU8jH1y8nZuNBp5wpDoEjlWRb_Wts-/view?usp=sharing](https://drive.google.com/file/d/1WEzU8jH1y8nZuNBp5wpDoEjlWRb_Wts-/view?usp=sharing)

## Resumen:

Es un juego de plataformas, para moverte puedes usar WASD o las flechitas, para saltar usa la barra espaciadora, para entrar a menú pausa puedes usar la tecla Esc, y el mouse junto al click izquierdo para disparar, si tienes municiones claro.

puedes acabar con enemigos saltandoles encima, pero si estos te tocan morirás instantaneamente, tambien puedes caer al vacío y morir.

## Funcionamiento:

## Lo nuevo:

### Version Android y Touch

Para crear la version Android tuve que modificar cómo funcionaban los input (en todo lo que usara input), y lo centralice en PlayerInputs.cs este se encarga de regresar el estado de cada uno de los inputs, y retorna los inputs según el systema activo, cuando se reconoce algun touch, activa el systema touch, y cuando se reconoce alguna tecla activa el system de teclado y mouse

Para crear los systemas cree primero PlayerInputHandler que es la base abstracta sobre la que los otros systemas se crearán, luego cree KeyboardAndMouseInputHandler, y re-mapee con cada uno de los inputos que estaba usando anteriormente, el reto fue al crear TouchInputHandler.cs, pues este se encarga de responder las mismas peticiones pero desde los touch, este funciona reconociendo la mitad izquierda de la pantalla como espacio para touch de movimiento, la parte derecha para touch de disparo (a menos que esté tocando el boton salto) y con un botón de salto se gestiona el inicio y fin del salto.

### Disparo Cargado

Ahora el personaje puede cargar su disparo y con un sistema de mascaras se visualiza la cantidad de carga del disparo, esta potencia aumenta y disminuye de acuerdo a la cantidad de tiempo que lleve oprimido el click, de esta forma podemos tener disparos cercano o lejanos según la estrategia del jugador, todo con un solo click.

Así mismo, es disparado un proyectil que va cambiando su rotación según la velocidad y dirección, que a su mismo tiempo se va modificando tambien por la gravedad, así que los disparos son notoriamente curvos, similar a Worms.

Esto lo logramos al combinar ShootingController con BasicBullet (la clase que lleva en su interior el disparo), ShootingController se encarga de hacer todos los calculos pertinentes al disparo, (el poder disparar o no está controlado por cada sub estado en el MachineState),

Cuando el disparo colisiona con algo, revisa si tiene el Layer Enviroment, si es así spawnea particulas de explosion y se auto destruye, si por el contrario choca con un enemigo, entonces spawnea particulas de sangre, busca el LifeController en el enemigo, invoka el TakeDamange y se auto destruye.

Esto es super importante, porque significa que los disparos pueden interactuar con cualquier objeto que tenga LifeController y (en el caso del BasicBullet) esté en el layer Enemy, con el Tag Enemy, algo que usaremos tambien para destruir objetos en el escenario como las cajas.

### Objetos que cambian el estado

Existen dos tipos de objetos que se pueden recoger, Healt que sería para aumentar la salud, y Munition para aumentar la municíon.

En el caso de Healt, realmente lo que hace es al estilo de Mario Bross realizar un cambio en el personaje poniendolo verde y agregandole un gorrito, esto simboliza que tenemos dos puntos de vida que es el maximo, si somos golpeados perdemos el gorrito y el color verde, simbolizando que regresamos de nuevo a un punto de vida.

Munition por otro lado, es la forma principal por la cual obtenemos munición en el juego, este item nos permite aumentar la cantidad de munición de nuestra arma en 5, nuestra munición actual la podemos evidenciar todo el tiempo en la parte superior izquierda de la interfaz.

Cada vez que disparamos el personaje hace una pequeña animación donde hace el arma pequeña (mientras esta está en rojo), esta se hace grande nuevamente si el personaje aun tiene munición para disparar, llegado el caso de no haber más munición el arma se quedara pequeña hasta encontrar nueva munición, esta parte es controlada tambien por **ShootingController.cs**

Sin embargo, para poder acceder a estos items, debemos romper las cajas que encontramos a lo largo del nivel, estas se distinguen entre 4

La primera es, BoxItem, esta es simplemente una caja que se rompe, puede romperse saltando sobre ella o con un disparo, es la base para las otras cajas.

La segunda sería BoxHealt que al momento de ser destruida deja en su lugar un item Healt.

La tercera es BoxMunition que al ser destruida deja munición.

y por ultimo está la BoxNonDestructible, que cómo su nombre lo indica no es posible destruirla. esta la cree para crear pequeños mini puzzles donde las cajas con items están bajo cajas indestructibles, para ver cómo el jugador se ingenia mover las cajas y obtener los items.

### CheckPoints Y SaveStates

Para hablar de los CheckPoints primero tenemos que hablar del sistema de guardado, y registro, de esto se encarga SaveSystem.cs una clase que cree en un inicio cómo Monobehaviour, pero a medida que avance con el proyecto, me di cuenta que necesitaba que esto fuera un poco más independiente de las escenas, y no quería crear un objeto persistente, así que decidí hacer la clase enteramente estatica.

Este se encarga de crear el archivo y el directorio, y guarda la partida en formato Json, para guardar la partida en diferentes slots cree estas dos estructuras de datos serializadas:

Por ahora en el juego solo vi pertinente guardar la posición de guardado (debido a que solo tengo un nivel), sin embargo, si necesitara ma inforación solo tendría que modificar el SaveData

El Checkpoint por otra parte es mucho más simple, (aunque tiene una animación bonita), simplemente es un trigger que al colisionar con el player envia la orden al SaveSystem de guardar esa posición, esto resumiendolo.

### Sonidos!!

Para el sistema de sonidos me inspiré un poco en el sistema de guardado, así que es un sistema semi estatico, pues lo estatico es su Instancía, y atraves de ella se puede acceder a cualquiera de sus acciones, para organizar cada uno de los sonidos posibles, cree un enum con cada uno de ellos.

Luego en la clase agregué referencias a cada uno de los audio clips y el audio source, y luego en el metodo PlayAudio con e uso de un Swich reproduzco el sonido acorde a la elección.

Acá un ejemplo de cómo se usa:

### Nuevos Enemigos

Ahora hay en teoría tres nuevas variantes de enemigos (debido a que el enemigo base tambien fue modificado)

Primero tenemos el enemigo base, su rango se aumentó, y se le agregó una nueva capacidad, la de saltar, pero no solo salta de forma aleatoría, salta según la situación en la que se encuentre (por si está bloqueado) y si reconoce que el jugador está en una parte superior a el, de esta forma puede escalar, e incluso escalar apilandose los unos a los otros, toda la información de como funciona está en sus StateMachine

En segundo lugar tenemos el enemigo rosa, este es más rapido y a diferencia del anterior que dejara de saltar si se encuentra en el mismo nivel que el jugador (de altura), este seguirá dando pequeños saltos aun así, de esta forma dispararle es mucho más dificil, y es mucho más peligroso, es un pequeño cambio pero afecta bastante la jugabilidad.

En tercer lugar tenemos el enemigo amarillo, este es completamente distinto a los anteriores, aunque tambien puede ser vencido saltandole encima, este toma distancia del jugador y se mantiene a cierta distancia, cuando se le dispara trata de evadir el disparo, y luego de unos segundos se avalanza a atacar al usuario de forma rapida para luego regresar a una posición defensiva.

Y por ultimo tendríamos al **enemigo final**, este está programado de forma totalmente distinta, Todo su codigo se encuentra en FinalBoss.cs, pero en resumen lo que hace es esperar hasta que un trigger cerca a el indica que debe iniciarse la batalla, en este momento el enemigo baja a un nivel donde es posible dispararle, y empieza a liberar objetos de forma aleatoria, puede liberar objetos cómo municion o salud, cómo tambien liberar enemigos del tipo basico o rosa (no agregué amarillo porque pensé que seria muy dificil), al derrotarlo el enemigo se auto destruirá con algunas particulas, sonará el sonido de victoria, y el jugador será recogido nuevamente por el helicoptero, mostrando la pantalla de victoria

### UI Mejorada

Remplace las tipografías, los textos, los botones, los estilos, re organice todo, y mejoré el estilo de cada una de estas interfaces, cómo tambien agregué el el poder acceder a diferentes partidas guardads.

## Lo Antiguo:

![Game Test: INVASION ALIENIGENA](./ext-9ae84cca2d.png)

Lo he creado teniendo en cuenta que pueda ser escalable, entnces cree un state machine basico que funcionará para todos los personajes (cuento como persnajes a enemigos y al jugador), pero cada uno creará su propia implementación, por ejemplo el jugador dicta el movimiento según el sistema de input (he usado el nuevo sistema de Input para esta implementacion), mientras que los enemigos dictan su movimiento por triggers que reconocen el jugador

![Game Test: INVASION ALIENIGENA](./ext-ab879704b3.png)

El State machine es gerarquico, así que primero pasa entre estados Root, como: grounded, Jump, y Airborn, y estos estados al entrar asignan sub estados de segunda categoría segun las variables que hay en el contexto (el contecto es el state machine), estos sub estados pueden sub asignarse tambien su estados, por eso algunso sub estados a su vez se asignan el sub estado HorizontalMovment

![Game Test: INVASION ALIENIGENA](./ext-7f95e4d4b3.png)

El resto del funcionamiento es muy simple, solo cada uno (jugador y enemigos) crean sus variantes del state machine base, y crean sus propias implementaciones, la idea era que tambien crearan sus propios sub estados y state factory, pero al final no fue necesario implementarlo (pero sigue estando ahi para poder escalar el proyecto en un futuro)

![Game Test: INVASION ALIENIGENA](./ext-51d88b5580.png)

![Game Test: INVASION ALIENIGENA](./ext-72881a2331.png)

Para la animación cree una clase llamada "CharacterAnimationController.cs" la cual los estads del state machine tienen cntrol, y envian diferentes cambios para el animator, el animator usados sub estados, para controlar las acciones de cuando el personaje está en el aire o en el suelo, (para el enemigos usé una copia de este mismo animator pero con animaciones del enemigo)

Para el escenario he usado un tilemap donode cree un tile dinamico que he usado para todo el escenario.

## Assets usados:

[DoTween](https://assetstore.unity.com/packages/tools/animation/dotween-hotween-v2-27676)
Para hacer transiciones rapidamente.

Cinemachine
Para hacer controlar el movimiento de la camara.

[Kenney 1bit Asset](https://kenney.nl/assets/1-bit-platformer-pack)
He usado esta textura para crear todos los sprites usados.
