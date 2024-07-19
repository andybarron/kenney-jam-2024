import * as ex from "excalibur";
import { BaseScene } from "../scene";
import { emptyLoadable } from "../util";

export class MainMenuScene extends BaseScene {
  override onInitialize(engine: ex.Engine): void {
    super.onInitialize(engine);

    async function newGame() {
      // TODO
    }

    this.ui.render(
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-4xl mb-8">Main menu</h1>
        <button
          className="border border-white hover:bg-white/25 py-2 px-4 rounded-full cursor-pointer pointer-events-auto"
          onClick={newGame}
        >
          New game
        </button>
      </div>,
    );
  }

  override onPreLoad(loader: ex.DefaultLoader): void {
    loader.addResource(emptyLoadable(0));
  }
}
