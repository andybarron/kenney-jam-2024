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

export function soundWithVolume(url: string, volume: number) {
  const sound = new ex.Sound(url);
  sound.volume = volume;
  return sound;
}

export function musicWithVolume(url: string, volume: number) {
  const music = soundWithVolume(url, volume);
  music.loop = true;
  return music;
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
