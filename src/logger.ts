import * as ex from "excalibur";

export const logger = ex.Logger.getInstance();

const { warn } = logger;
Object.assign(logger, {
  warn: (...args: unknown[]) => {
    if (
      args.some(
        (arg) =>
          typeof arg === "string" && arg.includes("not added to a scene"),
      )
    ) {
      return;
    }
    return warn.apply(logger, args);
  },
});
