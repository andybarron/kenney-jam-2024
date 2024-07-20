import * as ex from "excalibur";
import * as ti from "@excaliburjs/plugin-tiled";
import { BaseScene } from "~/src/scene.ts";
import { emptyLoadable, soundWithVolume, tiles } from "~/src/util.ts";
import { Song } from "~/src/song.ts";
import { LOAD_DELAY } from "~/src/debug.ts";
import {
  atom,
  useAtom,
  useAtomValue,
  type Atom,
  type PrimitiveAtom,
  getDefaultStore,
} from "jotai";
import { useCallback, useEffect, useRef } from "react";
import classNames from "classnames";

const MIN_VIEWPORT_SIZE = 150;
const MIN_ZOOM = 3;
const PLAYER_SPEED = tiles(3);

const songs = {
  face_the_facts: new Song({ url: "/music/face_the_facts.mp3", volume: 0.5 }),
  it_takes_a_hero: new Song({ url: "/music/it_takes_a_hero.mp3", volume: 0.5 }),
} as const;

const sfx = {
  inventory: soundWithVolume("/sfx/inventory.wav", 0.5),
};

type Inventory = readonly string[];
type Atoms = {
  inventory: Atom<Inventory>;
  inventoryOpen: PrimitiveAtom<boolean>;
};

export class GameplayScene extends BaseScene {
  store = getDefaultStore();
  atoms: Atoms = {
    inventory: atom<Inventory>(["anvil", "potion_red", "potion_red"]),
    inventoryOpen: atom(false),
  };
  map!: ti.TiledResource;
  override onPreLoad(loader: ex.DefaultLoader): void {
    super.onPreLoad(loader);
    loader.addResources(Object.values(songs));
    loader.addResources(Object.values(sfx));
    const map = new ti.TiledResource("/sampleMap.tmx");
    Object.assign(window, { map });
    loader.addResource(map);
    map.load();
    this.map = map;

    // enable delay for testing
    if (LOAD_DELAY != null) {
      loader.addResource(emptyLoadable(LOAD_DELAY));
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
        if (this.store.get(this.atoms.inventoryOpen)) {
          this.store.set(this.atoms.inventoryOpen, false);
        }

        const destScreenPos = this.input.pointers.primary.lastScreenPos;
        const srcScreenPos = engine.worldToScreenCoordinates(player.pos);
        player.vel.x = destScreenPos.x - srcScreenPos.x;
        player.vel.y = destScreenPos.y - srcScreenPos.y;
        const minDistance = this.camera.zoom;
        if (player.vel.size < minDistance) {
          player.vel.size = 0;
        } else {
          if (Math.sign(player.vel.x) !== 0 && Math.abs(player.vel.x) > 2) {
            player.graphics.current!.scale.x = Math.sign(player.vel.x);
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

    // ui
    this.ui.render(<Ui {...this.atoms} />);
  }

  private autoZoom() {
    const smallestScreenDimension = Math.min(
      this.engine.screen.contentArea.width,
      this.engine.screen.contentArea.height,
    );
    const scaleFactor = smallestScreenDimension / MIN_VIEWPORT_SIZE;
    this.camera.zoom = Math.max(MIN_ZOOM, Math.floor(scaleFactor));
  }
}

function Ui(atoms: Atoms) {
  const items = useAtomValue(atoms.inventory);
  const [showInventory, setShowInventory] = useAtom(atoms.inventoryOpen);
  const iconSrc = showInventory
    ? "/ui/inventory_open.png"
    : "/ui/inventory_closed.png";

  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) return;
    sfx.inventory.play();
  }, [showInventory]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const toggleInventory = useCallback(() => {
    setShowInventory((value) => !value);
  }, []);

  const inventoryButton = (
    <div className="fixed right-0 bottom-0 scale-[4] origin-bottom-right pointer-events-auto">
      <div className="relative">
        <div
          className="bg-black/50 p-0.5 hover:brightness-110 active:brightness-90"
          onClick={toggleInventory}
        >
          <img draggable="false" src={iconSrc} />
        </div>
        <div className="absolute right-0 bottom-full flex items-center justify-center">
          <div
            className={classNames(
              "bg-black/50 flex flex-wrap gap-0.5 p-0.5 transition duration-300 origin-bottom",
              {
                "scale-y-0 ease-in-cubic": !showInventory,
                "scale-y-100 ease-out-cubic": showInventory,
              },
            )}
          >
            {items.map((name) => (
              <img
                draggable="false"
                src={`/items/${name}.png`}
                style={{ width: 16, height: 16 }}
                key={name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return <>{inventoryButton}</>;
}
