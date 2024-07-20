import * as ex from "excalibur";
import { Loader } from "./loader.tsx";
import { GameplayScene } from "~/src/scenes/gameplay.tsx";

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

const game = new ex.Engine({
  backgroundColor: ex.Color.Black,
  displayMode: ex.DisplayMode.FillScreen,
  pixelArt: true,
  pointerScope: ex.PointerScope.Canvas,
  scrollPreventionMode: ex.ScrollPreventionMode.All,
  snapToPixel: false,
  viewport: { width: 800, height: 600 },
  scenes: {
    gameplay: {
      scene: new GameplayScene(),
      loader: new Loader(),
    },
  },
});

Object.assign(window, { game, ex });

await game.start();
game.goToScene("gameplay");
