import * as ex from "excalibur";
import { BaseScene } from "~/src/scene.ts";
import { MIN_ZOOM_DEFAULT } from "~/src/scenes/gameplay.tsx";
import { sample, tiles } from "~/src/util.ts";

const PARTY_RADIUS = tiles(2.5);
const MIN_VIEWPORT_SIZE = PARTY_RADIUS * 2 + tiles(1);

const PARTY_COLORS = [
  ex.Color.Azure,
  ex.Color.Blue,
  ex.Color.Chartreuse,
  ex.Color.Cyan,
  ex.Color.ExcaliburBlue,
  ex.Color.Green,
  ex.Color.Magenta,
  ex.Color.Orange,
  ex.Color.Red,
  ex.Color.Rose,
  ex.Color.Vermilion,
  ex.Color.Violet,
  ex.Color.Viridian,
  ex.Color.White,
  ex.Color.Yellow,
];
console.log(PARTY_COLORS);

export class VictoryScene extends BaseScene {
  override onInitialize(engine: ex.Engine): void {
    super.onInitialize(engine);
    this.camera.pos.setTo(0, 0);
    this.on("postupdate", this.autoZoom.bind(this));
    // this.ui.render(
    //   <div className="fixed left-0">

    //   </div>
    // )
    // this.ui.render(
    //   <div className="fixed inset-0 flex items-center justify-center">
    //     <div className="bg-gray-900 bg-opacity-80 text-white p-4">
    //       <h1 className="text-4xl">Victory!</h1>
    //       <p className="text-lg">You have defeated the evil wizard!</p>
    //       <button
    //         className="bg-gray-800 text-white px-4 py-2 rounded mt-4"
    //         onClick={() => this.engine.goToScene("title")}
    //       >
    //         Return to title
    //       </button>
    //     </div>
    //   </div>,
    // );
  }
  override onActivate(context: ex.SceneActivationContext<unknown>): void {
    const data = context.data;
    const actors: ex.Actor[] = [];
    if (
      data &&
      typeof data === "object" &&
      "actors" in data &&
      Array.isArray(data.actors)
    ) {
      for (const maybeActor of data.actors as unknown[]) {
        if (maybeActor instanceof ex.Actor) {
          actors.push(maybeActor);
        }
      }
    }
    const radius = tiles(2);
    const values: any[] = [];
    // place all actors in a circle equally spaced
    for (const [i, actor] of actors.entries()) {
      const angle = Math.PI * 2 * (i / actors.length);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      actor.pos.setTo(x, y);
      actor.body.collisionType = ex.CollisionType.PreventCollision;
      this.add(actor);
      values.push({ x, y });
      actor.actions.repeatForever((ctx) => {
        ctx.delay(500).callMethod(() => {
          const gfx = actor.graphics.current!;
          gfx.scale.x *= -1;
          gfx.tint = sample(PARTY_COLORS);
        });
      });
    }
  }

  private autoZoom() {
    const smallestScreenDimension = Math.min(
      this.engine.screen.contentArea.width,
      this.engine.screen.contentArea.height,
    );
    const scaleFactor = smallestScreenDimension / MIN_VIEWPORT_SIZE;
    const desiredZoom = Math.max(MIN_ZOOM_DEFAULT, Math.floor(scaleFactor));
    this.camera.zoom = desiredZoom;
  }
}
