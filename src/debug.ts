let INITIAL_PARAMS = new URLSearchParams(location.search);

export const LOAD_DELAY = getLoadDelay();
export const ENABLE_DEBUG = INITIAL_PARAMS.has("debug");

function getLoadDelay(): number | null {
  const delayValue = INITIAL_PARAMS.get("delay");
  if (delayValue != null) {
    const parsed = Number.parseInt(delayValue);
    return parsed > 0 ? parsed : 10;
  }
  return null;
}

INITIAL_PARAMS = new URLSearchParams();
