import * as ex from "excalibur";
import { makeResolvablePromise } from "~/src/util.ts";

export type SongParams = {
  url: string;
  volume?: number;
};

// TODO: hide/show tracking per-instance instead of global
let currentlyPlaying: Song | undefined;

// TODO: validate
function pauseOnHide() {
  if (currentlyPlaying?.sound.isPlaying()) {
    currentlyPlaying.pause(true);
  }
}
function resumeOnShow() {
  if (currentlyPlaying?.sound.isPaused()) {
    currentlyPlaying.play();
  }
}

window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" || document.hidden) {
    pauseOnHide();
  } else {
    resumeOnShow();
  }
});

export class Song implements ex.Loadable<Song> {
  readonly sound: ex.Sound;
  readonly volume: number;
  private fadeInterval?: number;
  private onFadeEnd?: () => void;
  constructor({ url, volume = 1 }: SongParams) {
    this.sound = new ex.Sound(url);
    this.volume = volume;

    this.sound.loop = true;
  }
  play(volume: number = this.volume) {
    this.stopFading();
    this.sound.volume = volume;
    this.sound.play();
    currentlyPlaying = this;
  }
  stop() {
    this.stopFading();
    this.sound.stop();
    if (currentlyPlaying === this) {
      currentlyPlaying = undefined;
    }
  }
  pause(resumeOnFocus = false) {
    this.stopFading();
    this.sound.pause();
    if (currentlyPlaying === this && !resumeOnFocus) {
      currentlyPlaying = undefined;
    }
  }
  private stopFading() {
    clearInterval(this.fadeInterval);
    delete this.fadeInterval;

    this.onFadeEnd?.();
    delete this.onFadeEnd;
  }
  private fadeVolume(endVolume: number, seconds: number): Promise<void> {
    this.stopFading();
    const volumePerSecond = (endVolume - this.sound.volume) / seconds;
    if (volumePerSecond === 0) return Promise.resolve();
    let last = performance.now();
    const { resolve, promise } = makeResolvablePromise<void>();
    this.onFadeEnd = resolve;
    this.fadeInterval = setInterval(() => {
      let now = performance.now();
      const delta = (now - last) / 1_000;
      last = now;

      const targetVolume = this.sound.volume + volumePerSecond * delta;
      const done =
        volumePerSecond > 0
          ? targetVolume >= endVolume
          : targetVolume <= endVolume;
      if (done) {
        this.sound.volume = endVolume;
        this.stopFading();
        if (endVolume === 0) {
          this.sound.stop();
        }
      } else {
        this.sound.volume = targetVolume;
      }
    }, 0);
    return promise;
  }
  async fadeIn(seconds: number): Promise<void> {
    if (this.sound.isPlaying()) {
      return;
    }
    this.play(0);
    return await this.fadeVolume(this.volume, seconds);
  }
  async fadeOut(seconds: number): Promise<void> {
    if (!this.sound.isPlaying()) {
      return;
    }
    if (currentlyPlaying === this) {
      currentlyPlaying = undefined;
    }
    return await this.fadeVolume(0, seconds);
  }
  async fadeTo(other: Song, seconds: number): Promise<void> {
    currentlyPlaying = other;
    await this.fadeOut(seconds / 2);
    return await other.fadeIn(seconds / 2);
  }

  data = this;
  async load(): Promise<Song> {
    await this.sound.load();
    return this;
  }
  isLoaded(): boolean {
    return this.sound.isLoaded();
  }
}
