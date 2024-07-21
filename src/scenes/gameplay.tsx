import * as ex from "excalibur";
import * as ti from "@excaliburjs/plugin-tiled";
import { BaseScene } from "~/src/scene.ts";
import {
  emptyLoadable,
  imageFromSrc,
  soundWithVolume,
  tiles,
} from "~/src/util.ts";
import { Song } from "~/src/song.ts";
import {
  GIVE_ALL_ITEMS,
  LOAD_DELAY,
  NOCLIP,
  INSTANT_WIN,
} from "~/src/debug.ts";
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

export const MIN_VIEWPORT_SIZE_DEFAULT = 200;
const MIN_VIEWPORT_SIZE_NOCLIP = MIN_VIEWPORT_SIZE_DEFAULT * 2;
const MIN_VIEWPORT_SIZE = NOCLIP
  ? MIN_VIEWPORT_SIZE_NOCLIP
  : MIN_VIEWPORT_SIZE_DEFAULT;
export const MIN_ZOOM_DEFAULT = 3;
const MIN_ZOOM_NOCLIP = 1;
const MIN_ZOOM = NOCLIP ? MIN_ZOOM_NOCLIP : MIN_ZOOM_DEFAULT;
const PLAYER_SPEED_DEFAULT = tiles(4);
const PLAYER_SPEED_NOCLIP = PLAYER_SPEED_DEFAULT * 5;
const PLAYER_SPEED = NOCLIP ? PLAYER_SPEED_NOCLIP : PLAYER_SPEED_DEFAULT;
const NPC_PLAYER_INTERACT_DISTANCE = tiles(2);
const EMOTE_SCALE_SPEED = 10;
const EMOTE_SCALE_SPEED_VECTOR = ex.vec(EMOTE_SCALE_SPEED, EMOTE_SCALE_SPEED);
const VECTOR_ONE = ex.vec(1, 1);
const ITEM_PICKUP_DISTANCE = tiles(1.5);

const songs = {
  face_the_facts: new Song({ url: "/music/face_the_facts.mp3", volume: 0.4 }),
  it_takes_a_hero: new Song({ url: "/music/it_takes_a_hero.mp3", volume: 0.5 }),
  the_world_is_ours: new Song({
    url: "/music/the_world_is_ours.mp3",
    volume: 0.6,
  }),
};

const sfx = {
  inventory: soundWithVolume("/sfx/inventory.wav", 0.5),
  yay: soundWithVolume("/sfx/yay.mp3", 0.75),
  pickup: soundWithVolume("/sfx/pickup.wav", 0.75),
  sparkle: soundWithVolume("/sfx/sparkle.mp3", 0.75),
  footstep: soundWithVolume("/sfx/footstep.mp3", 1.0),
};

const emotes = {
  blank: new ex.ImageSource("/emotes/blank.png"),
  heart: new ex.ImageSource("/emotes/heart.png"),
};

const items: Record<string, ex.ImageSource> = {
  axe: new ex.ImageSource("/items/axe.png"),
  bucket: new ex.ImageSource("/items/bucket.png"),
  fake_rat: new ex.ImageSource("/items/fake_rat.png"),
  gold: new ex.ImageSource("/items/gold.png"),
  gravestone: new ex.ImageSource("/items/gravestone.png"),
  juice: new ex.ImageSource("/items/juice.png"),
  mushroom: new ex.ImageSource("/items/mushroom.png"),
  shovel: new ex.ImageSource("/items/shovel.png"),
  wizard_staff: new ex.ImageSource("/items/wizard_staff.png"),
  none: new ex.ImageSource("/items/none.png"),
};

const images = {
  arrow: new ex.ImageSource("/ui/arrow.png"),
};

// cheaty way to force images to load for html img src
const imageCache: HTMLImageElement[] = [];
for (const imageSource of Object.values(items)) {
  imageCache.push(imageFromSrc(imageSource.path));
}

type Inventory = readonly { readonly id: string; readonly name: string }[];
type Atoms = {
  inventory: PrimitiveAtom<Inventory>;
  inventoryOpen: PrimitiveAtom<boolean>;
  pickingUpItem: PrimitiveAtom<boolean>;
  zoom: PrimitiveAtom<number>;
};

type Objective = {
  pos: ex.Vector;
  owner?: ex.Actor;
};

export class GameplayScene extends BaseScene {
  override backgroundColor = ex.Color.fromHex("#763b36");
  store = getDefaultStore();
  atoms: Atoms = {
    inventory: atom<Inventory>([]),
    inventoryOpen: atom(false),
    pickingUpItem: atom(false),
    zoom: atom(1),
  };
  map!: ti.TiledResource;
  override onPreLoad(loader: ex.DefaultLoader): void {
    super.onPreLoad(loader);
    loader.addResources(Object.values(songs));
    loader.addResources(Object.values(sfx));
    loader.addResources(Object.values(emotes));
    loader.addResources(Object.values(items));
    loader.addResources(Object.values(images));
    const map = new ti.TiledResource("/Connection.tmx");
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
    let winning = false;
    this.map.addToScene(this);
    let song = songs.face_the_facts;
    if (!INSTANT_WIN) song.play();

    let ducked = false;
    async function playSoundWithDuckedMusic(sound: ex.Sound) {
      if (ducked) {
        await sound.play();
        return;
      }
      ducked = true;
      try {
        await song.fadeVolume(0.1, 0.25, "pause");
        await sound.play();
        await song.fadeVolume(song.volume, 0.25);
      } finally {
        ducked = false;
      }
    }

    // player
    const player = this.actors.find((a) => a.name === "player")!;
    player.collider.set(ex.Shape.Box(8, 8));
    player.body.collisionType = ex.CollisionType.Active;
    if (NOCLIP) {
      player.body.collisionType = ex.CollisionType.PreventCollision;
    }
    Object.assign(window, { player });
    player.anchor.setTo(0.5, 0.5);
    let playerBounceOffset = -1;
    let movementDesired = false;
    player.actions.repeatForever((ctx) => {
      ctx.delay(movementDesired ? 100 : 250).callMethod(() => {
        if (playerBounceOffset > 0 && movementDesired) {
          sfx.footstep.play();
        }
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

    // objective tracking
    const arrows: ex.Actor[] = [];
    const objectives: Objective[] = [];
    this.on("postupdate", () => {
      while (arrows.length < objectives.length) {
        const arrow = new ex.Actor({
          z: 100,
        });
        arrow.graphics.use(images.arrow.toSprite());
        arrow.graphics.current!.opacity = 0.5;
        arrows.push(arrow);
        this.add(arrow);
      }
      while (arrows.length > objectives.length) {
        arrows.pop()!.kill();
      }
      for (const [i, arrow] of arrows.entries()) {
        const objective = objectives[i]!;
        const distance = tiles(1.5);
        const diff = objective.pos.sub(player.pos);
        const angle = diff.toAngle();
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        arrow.pos.setTo(player.pos.x + x, player.pos.y + y);
        arrow.rotation = angle;
      }
    });

    // camera
    this.camera.pos.setTo(player.pos.x, player.pos.y);
    this.camera.strategy.elasticToActor(player, 0.05, 0.5);
    this.camera.zoom = 5;
    this.on("postupdate", this.autoZoom.bind(this));

    // ui
    this.ui.render(<Ui {...this.atoms} />);

    // level data
    const exit = this.map.getObjectsByName("Exit")[0]!;
    const exitPos = ex.vec(exit.x, exit.y);
    const happySpots = this.map
      .getObjectLayers("Spots")[0]!
      .objects.map((obj) => ex.vec(obj.x, obj.y));
    const npcObjects = this.map.getObjectLayers("Characters")[0]!.objects;
    const itemObjects = this.map.getObjectLayers("Items")[0]!.objects;
    const itemNames = new Set<string>();
    const npcWants = new Map<string, string>();
    const npcGives = new Map<string, string>();
    for (const item of itemObjects) {
      if (item.name)
        itemNames.add(item.name.toLowerCase().replaceAll(" ", "_"));
    }
    for (const npc of npcObjects) {
      const npcName = npc.name;
      if (!npcName) continue;
      const wantsItem = npc.properties
        .get("wants")
        ?.toString()
        .toLowerCase()
        .replaceAll(" ", "_");
      const givesItem = npc.properties
        .get("gives")
        ?.toString()
        .toLowerCase()
        .replaceAll(" ", "_");
      if (typeof wantsItem === "string") {
        if (itemNames.has(wantsItem)) {
          npcWants.set(npcName, wantsItem);
        } else {
          console.warn(
            `NPC ${npcName} wants item "${wantsItem}" which does not exist`,
          );
        }
      }
      if (typeof givesItem === "string") {
        if (itemNames.has(givesItem)) {
          npcGives.set(npcName, givesItem);
        } else {
          console.warn(
            `NPC ${npcName} gives item "${givesItem}" which does not exist`,
          );
        }
      }
    }
    for (const itemName of itemNames) {
      const wanted = [...npcWants.values()].includes(itemName);
      if (!wanted) {
        itemNames.delete(itemName);
      }
    }
    const guardedItems = new Set(npcGives.values());
    if (GIVE_ALL_ITEMS) {
      this.store.set(
        this.atoms.inventory,
        [...itemNames].map((name) => ({ id: Math.random().toString(), name })),
      );
    }

    if (npcWants.size !== itemNames.size) {
      console.warn("NPC wants/item count mismatch", {
        npcWants,
        itemNames,
      });
    }
    let unhappyNpcCount = npcWants.size;
    const happyActors = new Set<ex.Actor>();

    // npcs
    const metNpcs = new Set<string>();
    for (const npcObject of npcObjects) {
      if (npcObject.name === "player") continue;
      const actors = this.actors.filter((a) => a.name === npcObject.name);
      if (!actors.length) {
        console.warn(`Actor not found for NPC object: ${npcObject.name}`);
        continue;
      }
      for (const actor of actors) {
        let happy = false;
        // visuals
        actor.z = 80;
        fixTiledActor(actor);
        // npc collision
        actor.body.collisionType = ex.CollisionType.Fixed;
        // npc animation
        let bounceOffset = 1;
        actor.actions.repeatForever((ctx) => {
          ctx.delay(happy ? 250 : 500).callMethod(() => {
            actor.graphics.current?.transform.translate(0, bounceOffset);
            bounceOffset *= -1;
          });
        });
        // npc emote
        const desiredItem = npcWants.get(actor.name);
        if (typeof desiredItem === "string") {
          const itemSprite = items[desiredItem]?.toSprite();
          const sprite = emotes.blank.toSprite();
          const emoteContainer = new ex.Actor({});
          const emote = new ex.Actor({
            anchor: ex.vec(0.5, 1),
            y: -10,
          });
          emote.graphics.use(sprite);
          emote.z = 85;
          emote.scale.setTo(0, 0);
          actor.addChild(emoteContainer);
          emoteContainer.addChild(emote);
          let itemActor: ex.Actor | undefined;
          if (itemSprite) {
            itemActor = new ex.Actor({
              y: -10,
            });
            itemActor.graphics.use(itemSprite);
            itemActor.z = emote.z + 1;
            emote.addChild(itemActor);
          }
          let emoteVisible = false;

          // bounce emote up and down
          const offsets = [1, -1, -1, 1];
          let i = 0;
          emoteContainer.actions.repeatForever((ctx) => {
            ctx.delay(happy ? 250 : 500).callMethod(() => {
              emoteContainer.pos.x += offsets[i]!;
              i = (i + 1) % offsets.length;
            });
          });

          // interact with player
          actor.on("postupdate", () => {
            const distanceToPlayer = player.pos.distance(actor.pos);
            const canInteract =
              distanceToPlayer <= NPC_PLAYER_INTERACT_DISTANCE;
            // take item and make npc happy if player has item
            const validWin =
              canInteract &&
              !happy &&
              this.store
                .get(this.atoms.inventory)
                .find((item) => item.name === desiredItem);
            const cheatWin = !happy && INSTANT_WIN;
            if (validWin || cheatWin) {
              happy = true;
              // remove objectives associated with this actor
              let index: number;
              while (
                (index = objectives.findIndex((o) => o.owner === actor)) !== -1
              ) {
                objectives.splice(index, 1);
              }
              unhappyNpcCount--;
              happyActors.add(actor);
              const guardedItem = npcGives.get(actor.name);
              if (guardedItem) {
                const timer = new ex.Timer({
                  fcn: () => {
                    guardedItems.delete(guardedItem);
                  },
                  interval: 500,
                  repeats: false,
                });
                this.add(timer);
                timer.start();
              }
              if (validWin) playSoundWithDuckedMusic(sfx.yay);
              emote.graphics.use(emotes.heart.toSprite());
              itemActor?.kill();
              this.store.set(this.atoms.inventory, (items) => {
                const index = items.findIndex(
                  (item) => item.name === desiredItem,
                );
                if (index !== -1) {
                  return items.filter((_, i) => i !== index);
                }
                return items;
              });
              const temp = new ex.Actor();
              this.add(temp);
              temp.actions
                .delay(1_000)
                .callMethod(() => {
                  actor.actions.clearActions();
                  const spot = happySpots.pop() ?? ex.Vector.Zero;
                  actor.actions
                    .moveTo(spot.x, spot.y, PLAYER_SPEED_DEFAULT * 2)
                    .repeatForever((ctx) => {
                      ctx.delay(500).callMethod(() => {
                        actor.scale.x *= -1;
                      });
                    });
                })
                .die();
            }
            // hide/show emote based on player distance
            if (canInteract && !emoteVisible) {
              emoteVisible = true;
              emote.actions.scaleTo(VECTOR_ONE, EMOTE_SCALE_SPEED_VECTOR);
              metNpcs.add(actor.name);
            } else if (!canInteract && emoteVisible) {
              emoteVisible = false;
              emote.actions.scaleTo(ex.vec(0, 0), EMOTE_SCALE_SPEED_VECTOR);
            }
          });
        }
      }
    }

    // items
    for (const itemObject of itemObjects) {
      const actor = this.actors.find((a) => a.name === itemObject.name);
      if (!actor) {
        console.warn(`Actor not found for item object: ${itemObject.name}`);
        continue;
      }
      fixTiledActor(actor);
      const canonicalName = itemObject.name!.toLowerCase().replaceAll(" ", "_");
      if (!itemNames.has(canonicalName)) {
        continue;
      }
      actor.z = 75;
      actor.body.collisionType = ex.CollisionType.PreventCollision;
      let nextTint: ex.Color = ex.Color.Blue;
      // item flash anim
      actor.on("postupdate", () => {
        const shouldHide = guardedItems.has(canonicalName);
        actor.graphics.current!.opacity = shouldHide ? 0 : 1;
      });
      actor.actions.repeatForever((ctx) => {
        ctx.delay(500).callMethod(() => {
          const gfx = actor.graphics.current;
          if (!gfx) return;
          const guarded = guardedItems.has(canonicalName);
          if (guarded) {
            gfx.tint = ex.Color.White;
            nextTint = ex.Color.Blue;
            return;
          }
          const currentTint = gfx.tint;
          gfx.tint = nextTint;
          nextTint = currentTint;
        });
      });
      // item pickup logic
      let pickedUp = false;
      actor.on("postupdate", () => {
        if (pickedUp) return;
        const guarded = guardedItems.has(canonicalName);
        if (guarded) return;
        const distanceToPlayer = player.pos.distance(actor.pos);
        if (distanceToPlayer <= ITEM_PICKUP_DISTANCE) {
          pickedUp = true;
          actor.actions.clearActions();
          const gfx = actor.graphics.current;
          if (gfx) {
            gfx.tint = ex.Color.White;

            // TODO: Copy inventory image from sprite
            // instead of hard-coding URL?
            // if (gfx instanceof ex.Sprite) {
            //   const { src } = gfx.image.image;
            // }
          }
          const animationTime = 0.25;
          const distanceToPlayer = actor.pos.distance(player.pos);
          // v = d / t
          const moveSpeed = distanceToPlayer / animationTime;
          const scaleSpeed = actor.scale.x / animationTime; // assume x and y scale are the same
          const moveToPlayerAction = new ex.MoveTo(
            actor,
            player.pos.x,
            player.pos.y,
            moveSpeed,
          );
          const scaleToZeroAction = new ex.ScaleTo(
            actor,
            0,
            0,
            scaleSpeed,
            scaleSpeed,
          );
          const parallel = new ex.ParallelActions([
            moveToPlayerAction,
            scaleToZeroAction,
          ]);
          // open inventory and fly item to player with sound
          this.store.set(this.atoms.pickingUpItem, true);
          actor.actions
            .callMethod(() => {
              sfx.pickup.play();
            })
            .runAction(parallel)
            .callMethod(() => {
              const temp = new ex.Actor();
              this.add(temp);
              temp.actions
                .delay(250)
                .callMethod(() => {
                  // add item to inventory
                  playSoundWithDuckedMusic(sfx.sparkle);
                  this.store.set(this.atoms.inventory, (items) => {
                    return [
                      ...items,
                      { name: canonicalName, id: Math.random().toString() },
                    ];
                  });
                  // if player has met npc who wants this item,
                  // add an objective pointing to that npc's location
                  for (const [npcName, itemName] of npcWants) {
                    if (itemName === canonicalName && metNpcs.has(npcName)) {
                      const npc = this.actors.find((a) => a.name === npcName);
                      if (npc) {
                        objectives.push({ pos: npc.pos, owner: npc });
                      }
                    }
                  }
                })
                .delay(1_000)
                .callMethod(() => {
                  // close inventory
                  this.store.set(this.atoms.pickingUpItem, false);
                })
                .die();
            })
            .die();
        }
      });
    }

    // victory screeeeech
    this.on("postupdate", () => {
      if (ducked) return; // prevent music weirdness
      if (winning) return;
      if (unhappyNpcCount === 0) {
        winning = true;
        objectives.push({ pos: exitPos });
        if (!INSTANT_WIN) {
          song.fadeTo(songs.it_takes_a_hero, 1);
          song = songs.it_takes_a_hero;
        }
      }
    });

    // go to victory scene if ready
    let gone = false;
    this.on("postupdate", () => {
      if (gone || !winning) return;
      const distanceToExit = player.pos.distance(exitPos);
      if (distanceToExit <= NPC_PLAYER_INTERACT_DISTANCE) {
        gone = true;
        Object.values(sfx).forEach((sfx) => sfx.stop());
        song.fadeTo(songs.the_world_is_ours, 1);
        happyActors.add(player);
        this.engine.goToScene("victory", {
          sceneActivationData: {
            actors: [...happyActors].map((original) => {
              const gfx = original.graphics.current as ex.Sprite;
              const sprite = ex.Sprite.from(gfx.image);
              sprite.sourceView = gfx.sourceView;
              sprite.destSize = gfx.destSize;
              const actor = new ex.Actor({
                anchor: ex.vec(0.5, 0.5),
              });
              actor.graphics.use(sprite);
              return actor;
            }),
          },
        });
      }
    });
  }

  private autoZoom() {
    const smallestScreenDimension = Math.min(
      this.engine.screen.contentArea.width,
      this.engine.screen.contentArea.height,
    );
    const scaleFactor = smallestScreenDimension / MIN_VIEWPORT_SIZE;
    const desiredZoom = Math.max(MIN_ZOOM, Math.floor(scaleFactor));
    this.camera.zoom = desiredZoom;
    if (this.store.get(this.atoms.zoom) !== desiredZoom) {
      this.store.set(this.atoms.zoom, desiredZoom);
    }
  }
}

// trick browser into loading images
const inventoryOpenImage = imageFromSrc("/ui/inventory_open.png");
const inventoryClosedImage = imageFromSrc("/ui/inventory_closed.png");

function Ui(atoms: Atoms) {
  const zoom = useAtomValue(atoms.zoom);
  const items = useAtomValue(atoms.inventory);
  const [inventoryOpen, setInventoryOpen] = useAtom(atoms.inventoryOpen);
  const pickingUpItem = useAtomValue(atoms.pickingUpItem);

  const mountedRef = useRef(false);
  const showInventory = inventoryOpen || pickingUpItem;
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
    setInventoryOpen((value) => !value);
  }, []);

  const iconSrc = showInventory
    ? inventoryOpenImage.src
    : inventoryClosedImage.src;

  const inventoryButton = (
    <div
      className="fixed right-0 bottom-0 scale origin-bottom-right pointer-events-auto"
      style={{ transform: `scale(${zoom})` }}
    >
      <div className="relative">
        <div
          className="bg-black/50 p-0.5 hover:brightness-110 active:brightness-90"
          onClick={toggleInventory}
        >
          <img draggable="false" src={iconSrc} />
        </div>
        <div className="absolute right-0 overflow-visible bottom-full flex items-end justify-end">
          <div
            className={classNames(
              "bg-black/50 grid grid-rows-4 grid-flow-col auto-cols-max gap-0.5 p-0.5 transition origin-bottom",
              {
                "scale-y-0 opacity-0 ease-in-cubic": !showInventory,
                "scale-y-100 opacity-100 ease-out-cubic": showInventory,
              },
            )}
          >
            {items.map(({ name, id }, i) => (
              <img
                className="shine"
                draggable="false"
                src={`/items/${name}.png`}
                style={{ width: 16, height: 16 }}
                key={id}
              />
            ))}
            {items.length === 0 && (
              <img
                className="opacity-50"
                draggable="false"
                src={`/items/none.png`}
                style={{ width: 16, height: 16 }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return <>{inventoryButton}</>;
}
function fixTiledActor(actor: ex.Actor) {
  actor.anchor.setTo(0.5, 0.5);
  actor.collider.get().offset.setTo(-actor.width / 2, actor.height / 2);
  actor.pos.x += actor.width / 2;
  actor.pos.y -= actor.height / 2;
}
