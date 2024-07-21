import * as ex from "excalibur";
import { Credits } from "~/src/components/credits.tsx";
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

export class VictoryScene extends BaseScene {
  override backgroundColor = ex.Color.fromHex("#222222");
  override onInitialize(engine: ex.Engine): void {
    super.onInitialize(engine);
    this.camera.pos.setTo(0, 0);
    this.on("postupdate", this.autoZoom.bind(this));
    this.ui.render(<Credits />);
  }
  override onActivate(context: ex.SceneActivationContext<unknown>): void {
    super.onActivate(context);
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
    // place all actors in a circle equally spaced
    for (const [i, actor] of actors.entries()) {
      const angle = Math.PI * 2 * (i / actors.length);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      actor.pos.setTo(x, y);
      actor.body.collisionType = ex.CollisionType.PreventCollision;
      this.add(actor);
      let offset = 1 * (Math.random() < 0.5 ? 1 : -1);
      actor.actions.repeatForever((ctx) => {
        ctx.delay(300).callMethod(() => {
          const gfx = actor.graphics.current!;
          gfx.scale.x *= -1;
          gfx.tint = sample(PARTY_COLORS);
          actor.pos.y += offset;
          offset *= -1;
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
