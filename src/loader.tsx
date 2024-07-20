import * as ex from "excalibur";
import { LoaderCircleIcon } from "lucide-react";
import { createRoot } from "react-dom/client";

export class Loader extends ex.DefaultLoader {
  overlay = (() => {
    const el = document.createElement("div");
    el.className = [
      "fixed inset-0 p-4 bg-black flex flex-row gap-4 items-center justify-center",
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
      this.root.render("Click to continue");
    }
  }

  override async onBeforeLoad(): Promise<void> {
    this.loaded = this.resources.every((r) => r.isLoaded());
    document.body.appendChild(this.overlay);
    this.onUpdate();
    this.root.render(<LoaderCircleIcon className="animate-spin" />);
  }

  override async onAfterLoad(): Promise<void> {
    this.overlay.remove();
  }
}
