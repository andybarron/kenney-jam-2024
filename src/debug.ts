let INITIAL_PARAMS = new URLSearchParams(location.search);

export const LOAD_DELAY = getLoadDelay();
export const ENABLE_DEBUG = INITIAL_PARAMS.has("debug");
export const ENABLE_CHEATS = INITIAL_PARAMS.has("ch");
export const GIVE_ALL_ITEMS = ENABLE_CHEATS && INITIAL_PARAMS.has("it");
export const NOCLIP = ENABLE_CHEATS && INITIAL_PARAMS.has("nc");

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
