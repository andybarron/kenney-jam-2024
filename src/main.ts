import { logger } from "./logger.ts";

import * as ex from "excalibur";
import { MainMenuScene } from "./scenes/main_menu";
import { Loader } from "./loader.tsx";

const game = new ex.Engine({
  backgroundColor: ex.Color.Black,
  displayMode: ex.DisplayMode.FillScreen,
  pixelArt: true,
  pointerScope: ex.PointerScope.Canvas,
  scrollPreventionMode: ex.ScrollPreventionMode.All,
  snapToPixel: true,
  viewport: { width: 800, height: 600 },
  scenes: {
    mainMenu: {
      scene: new MainMenuScene(),
      loader: Loader,
    },
  },
});

Object.assign(window, { game, logger, ex });

await game.start();
game.goToScene("mainMenu");
