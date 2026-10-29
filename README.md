# Spooky Pumpkin Catcher

A two-level browser game. Level 1 is Pumpkin Catcher; surviving its 60-second round unlocks Level 2, Graveyard Dash.

## Run locally

Serve this folder over HTTP, then open `http://localhost:8000`:

```sh
python3 -m http.server 8000
```

The project uses native JavaScript modules and has no build step or package dependencies.

## Project layout

```text
css/
  game.css                 Shared game shell and interface styles
js/
  main.js                  Browser entry point
  core/
    GameController.js      Campaign flow, input, resize, and game loop
    GameInput.js           Keyboard, pointer, and touch input routing
    GameState.js           Shared state names
    HighScoreStore.js      Local high-score persistence
    SoundManager.js        Shared sound effects and Level 2 music
  levels/
    PumpkinLevel.js        Level 1 gameplay
    GraveyardLevel.js      Level 2 gameplay and entity coordination
    GraveyardBackground.js Level 2 scenery
    GraveyardEntities.js   Level 2 player, hazards, collectibles, particles
  ui/
    GameUI.js              DOM screen and HUD updates
```

`graveyard_dash_skeleton_run.html` remains as a compatibility entry point and opens the full two-level game.
