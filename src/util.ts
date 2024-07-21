import * as ex from "excalibur";

export const emptyLoadable = (seconds: number = 0): ex.Loadable<void> => {
  let loaded = false;
  return {
    data: undefined,
    isLoaded: () => loaded,
    load: () =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          loaded = true;
          resolve();
        }, seconds * 1_000);
      }),
  };
};

export function tiles(n: number) {
  return 16 * n;
}

export function soundWithVolume(
  url: string,
  volume: number,
  loop: boolean = false,
) {
  const sound = new ex.Sound(url);
  sound.volume = volume;
  sound.loop = loop;
  return sound;
}

export function makeResolvablePromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export const TOUCH_SUPPORTED = "ontouchstart" in window;

export function imageFromSrc(src: string) {
  const image = new Image();
  image.src = src;
  return image;
}
