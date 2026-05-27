import {ActionManager} from "@babylonjs/core";

export class InputController {

  constructor(scene) {
    scene.actionManager = new ActionManager(scene);
    this.inputMap = {};
    this.allowedKeys = new Set([
      "arrowleft",
      "arrowright",
      "a",
      "d",
      "shift",
      "enter",
      "space",
    ]);

    const shouldIgnoreEvent = (event) => {
      const target = event.target;
      if (!target || !(target instanceof Element)) return false;

      // Never hijack keystrokes while user is typing in form fields/editors.
      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.closest("[contenteditable='true']") != null
      );
    };

    const toKey = (event) => (event.key === " " ? "space" : event.key.toLowerCase());

    window.addEventListener("keydown", (key) => {
      if (shouldIgnoreEvent(key)) return;

      const keyPressed = toKey(key);
      if (!this.allowedKeys.has(keyPressed)) return;

      key.preventDefault();
      key.stopPropagation();
      this.inputMap[keyPressed] = true;
    });

    window.addEventListener("keyup", (key) => {
      if (shouldIgnoreEvent(key)) return;

      const keyPressed = toKey(key);
      if (!this.allowedKeys.has(keyPressed)) return;

      key.preventDefault();
      key.stopPropagation();
      this.inputMap[keyPressed] = false;
    });
  }
}
