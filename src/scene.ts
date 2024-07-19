import * as ex from "excalibur";
import { createRoot, type Root } from "react-dom/client";

export class BaseScene extends ex.Scene {
  #uiElementValue?: HTMLElement;
  get #uiElement(): HTMLElement {
    return (this.#uiElementValue ??= createEl());
  }
  #uiValue?: Root;
  get ui(): Root {
    return (this.#uiValue ??= createRoot(this.#uiElement));
  }
  override onActivate(context: ex.SceneActivationContext<unknown>): void {
    document.body.appendChild(this.#uiElement);
  }
  override onDeactivate(context: ex.SceneActivationContext): void {
    this.#uiElement.remove();
  }
  override onInitialize(engine: ex.Engine): void {
    window.addEventListener("blur", () => {
      if (!this.isCurrentScene()) {
        return;
      }
      this.onBlur();
    });
  }
  onBlur(): void {}
}

function createEl() {
  const el = document.createElement("div");
  el.className = "fixed inset-0 p-0 m-0 pointer-events-none select-none";
  return el;
}
