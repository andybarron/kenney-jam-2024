import * as ex from "excalibur";
import * as ti from "@excaliburjs/plugin-tiled";
import { BaseScene } from "~/src/scene.ts";
import { emptyLoadable, tiles } from "~/src/util.ts";
import { Song } from "~/src/song.ts";

const MIN_VIEWPORT_SIZE = 150;
const MIN_ZOOM = 3;
const PLAYER_SPEED = tiles(3);

const songs = {
  face_the_facts: new Song({ url: "/music/face_the_facts.mp3", volume: 0.5 }),
  it_takes_a_hero: new Song({ url: "/music/it_takes_a_hero.mp3", volume: 0.5 }),
} as const;

export class GameplayScene extends BaseScene {
  map!: ti.TiledResource;
  override onPreLoad(loader: ex.DefaultLoader): void {
    super.onPreLoad(loader);
    loader.addResources(Object.values(songs));
    const map = new ti.TiledResource("/sampleMap.tmx");
    Object.assign(window, { map });
    loader.addResource(map);
    map.load();
    this.map = map;

    // enable delay for testing
    const params = new URLSearchParams(location.search);
    const delayValue = params.get("delay");
    if (delayValue != null) {
      const parsed = Number.parseInt(delayValue);
      const seconds = parsed > 0 ? parsed : 10;
      loader.addResource(emptyLoadable(seconds));
    }
  }
  override onInitialize(engine: ex.Engine): void {
    super.onInitialize(engine);
    this.map.addToScene(this);
    const song = songs.face_the_facts;
    song.play();

    // player
    const player = this.actors.find((a) => a.name === "player")!;
    player.collider.set(ex.Shape.Box(8, 8));
    player.body.collisionType = ex.CollisionType.Active;
    player.anchor.setTo(0.5, 0.5);
    let playerBounceOffset = -1;
    let movementDesired = false;
    player.actions.repeatForever((ctx) => {
      ctx.delay(movementDesired ? 100 : 250).callMethod(() => {
        player.graphics.current?.transform.translate(0, playerBounceOffset);
        playerBounceOffset *= -1;
      });
    });
    player.z = 90;
    // player movement
    player.on("postupdate", () => {
      movementDesired = this.input.pointers.isDown(0);
      player.vel.setTo(0, 0);
      if (movementDesired) {
        const destScreenPos = this.input.pointers.primary.lastScreenPos;
        const srcScreenPos = engine.worldToScreenCoordinates(player.pos);
        player.vel.x = destScreenPos.x - srcScreenPos.x;
        player.vel.y = destScreenPos.y - srcScreenPos.y;
        const minDistance = this.camera.zoom;
        if (player.vel.size < minDistance) {
          player.vel.size = 0;
        } else {
          if (Math.sign(player.vel.x) !== 0 && Math.abs(player.vel.x) > 2) {
            player.scale.x = Math.sign(player.vel.x);
          }

          player.vel.size = PLAYER_SPEED;
        }
      }
    });

    // camera
    this.camera.pos.setTo(player.pos.x, player.pos.y);
    this.camera.strategy.elasticToActor(player, 0.05, 0.5);
    this.camera.zoom = 5;
    this.on("postupdate", this.autoZoom.bind(this));
  }

  private autoZoom() {
    const smallestScreenDimension = Math.min(
      this.engine.screen.contentArea.width,
      this.engine.screen.contentArea.height,
    );
    const scaleFactor = smallestScreenDimension / MIN_VIEWPORT_SIZE;
    console.log(scaleFactor);
    this.camera.zoom = Math.max(MIN_ZOOM, Math.floor(scaleFactor));
  }
}
