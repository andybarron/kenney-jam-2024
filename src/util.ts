import type * as ex from "excalibur";

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
