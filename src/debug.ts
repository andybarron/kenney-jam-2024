let INITIAL_PARAMS = new URLSearchParams(location.search);

export const LOAD_DELAY = getLoadDelay();
export const ENABLE_DEBUG = INITIAL_PARAMS.has("debug");
export const CHEATS = INITIAL_PARAMS.getAll("cheat");
export const GIVE_ALL_ITEMS = CHEATS.includes("items");
export const NOCLIP = CHEATS.includes("noclip");

function getLoadDelay(): number | null {
  const delayValue = INITIAL_PARAMS.get("delay");
  if (delayValue != null) {
    const parsed = Number.parseInt(delayValue);
    return parsed > 0 ? parsed : 10;
  }
  return null;
}

// clear params
INITIAL_PARAMS = new URLSearchParams();
