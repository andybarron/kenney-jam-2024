import * as ex from "excalibur";
import { createRoot } from "react-dom/client";
import { TOUCH_SUPPORTED } from "~/src/util.ts";

const PLAY_BUTTON_URL = "/ui/play_button.png";
const SPINNER_URL = "/ui/spinner.png";

export class Loader extends ex.DefaultLoader {
  overlay = (() => {
    const el = document.createElement("div");
    el.className = [
      "fixed inset-0 p-4 bg-black flex flex-col gap-4 items-center justify-center",
      "text-white fade-in",
    ].join(" ");
    el.innerHTML = "Loading...";
    return el;
  })();
  root = createRoot(this.overlay);
  loaded = false;

  override onUserAction(): Promise<void> {
    if (ex.WebAudio.isUnlocked()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      window.addEventListener(
        "click",
        () => {
          resolve();
        },
        { once: true },
      );
    });
  }
  override onDraw(): void {}
  override onUpdate(): void {
    if (this.progress === 1 && !this.loaded) {
      this.loaded = true;
      this.root.render(
        <>
          <span className="fade-in">&nbsp;</span>
          <span className="fade-in border border-white scale-[4] p-1 hover:bg-white/25 relative my-8">
            <img src={PLAY_BUTTON_URL} className="animate-wiggle" />
          </span>
          <span className="fade-in">
            {TOUCH_SUPPORTED ? "Tap" : "Click"} to start
          </span>
        </>,
      );
    }
  }

  override async onBeforeLoad(): Promise<void> {
    this.loaded = this.resources.every((r) => r.isLoaded());
    document.body.appendChild(this.overlay);
    this.onUpdate();
    // this.root.render(<LoaderCircleIcon className="pixel-spin" />);
    this.root.render(
      <>
        <img src={PLAY_BUTTON_URL} className="hidden" />
        <img src={SPINNER_URL} className="animate-pixel-spin scale-[4]" />
      </>,
    );
  }

  override async onAfterLoad(): Promise<void> {
    this.overlay.remove();
  }
}
