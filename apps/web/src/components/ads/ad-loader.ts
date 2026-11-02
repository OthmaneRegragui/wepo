import { NATIVE_BANNER, SOCIAL_BAR, type DisplayBannerConfig } from './ad-config';

/**
 * Adsterra loader.
 *
 * Classic display banners share the global `window.atOptions` variable, so they
 * are loaded through one serial queue: set options, append the script, wait for
 * it to run, then release the next banner. Every banner keeps its own
 * container, and an entry is reused across React StrictMode's mount/unmount
 * cycle instead of spawning a second script.
 */

export type AdStatus = 'idle' | 'loading' | 'loaded' | 'failed';

const DISPLAY_SCRIPT_TIMEOUT_MS = 15_000;
const DISPLAY_SEQUENCE_GAP_MS = 350;
const NATIVE_SCRIPT_TIMEOUT_MS = 15_000;

interface AtOptions {
  key: string;
  format: 'iframe';
  height: number;
  width: number;
  params: Record<string, never>;
}

declare global {
  interface Window {
    atOptions?: AtOptions;
  }

  interface HTMLIFrameElement {
    credentialless?: boolean;
  }
}

type StatusListener = (status: AdStatus) => void;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setContainerStatus(container: HTMLElement, status: AdStatus): void {
  container.dataset.wepoAdStatus = status;
}

function notify(listeners: Set<StatusListener>, status: AdStatus): void {
  for (const listener of listeners) listener(status);
}

/**
 * Script load and ad fill are different events. A publisher script can return
 * 200 and still leave the container empty (no inventory, blocker, bot filter),
 * so record fill separately from the loader status.
 */
function hasAdContent(container: HTMLElement): boolean {
  return Array.from(container.childNodes).some((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) return (node as Element).tagName !== 'SCRIPT';
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').trim().length > 0;
    return false;
  });
}

function markAdServed(container: HTMLElement, served: boolean): void {
  if (served) container.dataset.wepoAdServed = 'true';
  else delete container.dataset.wepoAdServed;
}

/** Watch a container for publisher content and record fill independently. */
function watchForAdFill(container: HTMLElement): () => void {
  const update = () => markAdServed(container, hasAdContent(container));
  update();
  if (typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(update);
  observer.observe(container, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/* ------------------------------------------------------------------ */
/* Classic display banners                                             */
/* ------------------------------------------------------------------ */

interface DisplayEntry {
  config: DisplayBannerConfig;
  container: HTMLElement;
  listeners: Set<StatusListener>;
  status: AdStatus;
  started: boolean;
  cancelled: boolean;
  script: HTMLScriptElement | null;
  options: AtOptions | null;
  cancelScriptWait: (() => void) | null;
  destroyTimer: number | null;
  servedWatcher: (() => void) | null;
}

const displayEntries = new WeakMap<HTMLElement, DisplayEntry>();
let displayQueue: Promise<void> = Promise.resolve();

function updateDisplayStatus(entry: DisplayEntry, status: AdStatus): void {
  entry.status = status;
  setContainerStatus(entry.container, status);
  notify(entry.listeners, status);
}

function releaseOptions(entry: DisplayEntry): void {
  if (entry.options && window.atOptions === entry.options) {
    delete window.atOptions;
  }
  entry.options = null;
}

async function runDisplayBanner(entry: DisplayEntry): Promise<void> {
  if (entry.cancelled) return;

  const { config, container } = entry;
  if (!container.isConnected) {
    entry.cancelled = true;
    return;
  }

  entry.started = true;
  updateDisplayStatus(entry, 'loading');

  // A remount can leave a failed/aborted node behind. The container belongs to
  // this ad slot only, so it is safe to clear before retrying.
  container.replaceChildren();

  const options: AtOptions = {
    key: config.key,
    format: 'iframe',
    height: config.height,
    width: config.width,
    params: {},
  };
  entry.options = options;
  window.atOptions = options;

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = false;
  script.dataset.cfasync = 'false';
  // COEP credentialless is required for third-party ad resources. Request CORS
  // mode for the publisher scripts so failures are observable via load/error.
  script.crossOrigin = 'anonymous';
  script.src = config.scriptSrc;
  script.dataset.wepoAdBanner = config.size;
  script.dataset.wepoAdKey = config.key;
  entry.script = script;

  const result = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      resolve(loaded);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    const timeout = window.setTimeout(() => finish(false), DISPLAY_SCRIPT_TIMEOUT_MS);
    entry.cancelScriptWait = () => finish(false);
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
  });

  container.appendChild(script);

  const loaded = await result;
  entry.cancelScriptWait = null;

  // atOptions is normally deleted by the Adsterra script. Clean it up even
  // when the script failed so a stale size cannot leak into the next banner.
  releaseOptions(entry);

  if (entry.cancelled) {
    script.remove();
    return;
  }

  if (!loaded) {
    script.remove();
    updateDisplayStatus(entry, 'failed');
    return;
  }

  updateDisplayStatus(entry, 'loaded');
  entry.servedWatcher = watchForAdFill(container);

  // Let the script finish reading atOptions and inserting its iframe before
  // the next banner is allowed to overwrite the global.
  await delay(DISPLAY_SEQUENCE_GAP_MS);
}

function scheduleDisplayBanner(entry: DisplayEntry): void {
  displayQueue = displayQueue
    .then(() => runDisplayBanner(entry))
    .catch(() => {
      if (!entry.cancelled) updateDisplayStatus(entry, 'failed');
    });
}

function destroyDisplayEntry(entry: DisplayEntry): void {
  entry.cancelled = true;
  entry.servedWatcher?.();
  entry.servedWatcher = null;
  entry.cancelScriptWait?.();
  entry.cancelScriptWait = null;
  releaseOptions(entry);
  entry.script?.remove();
  entry.script = null;
  entry.container.replaceChildren();
  delete entry.container.dataset.wepoAdStatus;
  delete entry.container.dataset.wepoAdServed;
}

/**
 * Mount a classic display banner into a dedicated container. The returned
 * cleanup is deferred by one task so React StrictMode's immediate remount can
 * cancel it and reuse the same entry.
 */
export function mountDisplayBanner(
  config: DisplayBannerConfig,
  container: HTMLElement,
  listener?: StatusListener,
): () => void {
  let entry = displayEntries.get(container);

  if (entry && entry.config !== config) {
    displayEntries.delete(container);
    destroyDisplayEntry(entry);
    entry = undefined;
  }

  if (!entry) {
    entry = {
      config,
      container,
      listeners: new Set(),
      status: 'idle',
      started: false,
      cancelled: false,
      script: null,
      options: null,
      cancelScriptWait: null,
      destroyTimer: null,
      servedWatcher: null,
    };
    displayEntries.set(container, entry);
    scheduleDisplayBanner(entry);
  }

  if (entry.destroyTimer !== null) {
    window.clearTimeout(entry.destroyTimer);
    entry.destroyTimer = null;
  }

  if (listener) {
    entry.listeners.add(listener);
    listener(entry.status);
  }

  let cleanedUp = false;
  return () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (listener) entry.listeners.delete(listener);
    if (entry.destroyTimer !== null) return;
    entry.destroyTimer = window.setTimeout(() => {
      entry.destroyTimer = null;
      if (displayEntries.get(container) !== entry) return;
      displayEntries.delete(container);
      destroyDisplayEntry(entry);
    }, 0);
  };
}

/* ------------------------------------------------------------------ */
/* Native banner                                                       */
/* ------------------------------------------------------------------ */

interface NativeState {
  host: HTMLElement | null;
  activeSlot: HTMLElement | null;
  script: HTMLScriptElement | null;
  scriptStarted: boolean;
  status: AdStatus;
  served: boolean;
  listeners: Set<StatusListener>;
  cancelScriptWait: (() => void) | null;
  servedWatcher: (() => void) | null;
  releaseTimer: number | null;
}

const nativeState: NativeState = {
  host: null,
  activeSlot: null,
  script: null,
  scriptStarted: false,
  status: 'idle',
  served: false,
  listeners: new Set(),
  cancelScriptWait: null,
  servedWatcher: null,
  releaseTimer: null,
};

function updateNativeStatus(status: AdStatus): void {
  nativeState.status = status;
  if (nativeState.host) setContainerStatus(nativeState.host, status);
  notify(nativeState.listeners, status);
}

function updateNativeServed(): void {
  const { host, activeSlot } = nativeState;
  if (!host) return;
  nativeState.served = hasAdContent(host);
  markAdServed(host, nativeState.served);
  if (activeSlot) markAdServed(activeSlot, nativeState.served);
}

function watchNativeFill(): void {
  if (nativeState.servedWatcher || !nativeState.host) return;
  updateNativeServed();
  if (typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver(updateNativeServed);
  observer.observe(nativeState.host, { childList: true, subtree: true });
  nativeState.servedWatcher = () => observer.disconnect();
}

/**
 * The publisher requires one container with the exact `container-<key>` id.
 * The live container is detached (not parked in a hidden live page) while no
 * eligible slot is mounted, so an editor route never hosts a concealed ad. The
 * same node is re-attached on the next eligible page, preserving any filled
 * creative without re-running the script.
 */
function ensureNativeHost(): HTMLElement {
  // Never create a second host: if React removed the previous slot, the same
  // node is simply re-attached to the next slot.
  if (nativeState.host) return nativeState.host;

  const host = document.createElement('div');
  host.id = NATIVE_BANNER.containerId;
  host.className = 'wepo-native-container w-full';
  host.dataset.wepoNativeContainer = NATIVE_BANNER.key;
  host.style.width = '100%';
  host.style.minHeight = '250px';

  nativeState.host = host;
  watchNativeFill();
  return host;
}

function startNativeScript(): void {
  if (nativeState.scriptStarted || !nativeState.host) return;
  nativeState.scriptStarted = true;
  updateNativeStatus('loading');

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset.cfasync = 'false';
  script.dataset.wepoNativeKey = NATIVE_BANNER.key;
  script.src = NATIVE_BANNER.scriptSrc;
  nativeState.script = script;

  const result = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      resolve(loaded);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    const timeout = window.setTimeout(() => finish(false), NATIVE_SCRIPT_TIMEOUT_MS);
    nativeState.cancelScriptWait = () => finish(false);
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
  });

  nativeState.host.appendChild(script);

  void result.then((loaded) => {
    nativeState.cancelScriptWait = null;
    if (!loaded) {
      script.remove();
      updateNativeStatus('failed');
      return;
    }
    updateNativeStatus('loaded');
    watchNativeFill();
  });
}

/**
 * Attach the singleton native banner container to a page slot. The returned
 * cleanup only detaches listeners; the host itself is detached until the next
 * eligible page mounts, so SPA navigation never reloads or duplicates the
 * publisher script and editor routes never host a concealed placement.
 */
export function attachNativeBanner(slot: HTMLElement, listener?: StatusListener): () => void {
  if (nativeState.releaseTimer !== null) {
    window.clearTimeout(nativeState.releaseTimer);
    nativeState.releaseTimer = null;
  }

  const host = ensureNativeHost();
  if (host.parentElement !== slot) slot.appendChild(host);
  startNativeScript();

  nativeState.activeSlot = slot;
  if (nativeState.served) markAdServed(slot, true);
  else delete slot.dataset.wepoAdServed;

  if (listener) {
    nativeState.listeners.add(listener);
    listener(nativeState.status);
  }

  let cleanedUp = false;
  return () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (listener) nativeState.listeners.delete(listener);
    if (nativeState.listeners.size > 0 || nativeState.releaseTimer !== null) return;

    // Defer detaching so React StrictMode's immediate remount (and route
    // transitions where the next slot mounts in the same commit) can keep the
    // host where it is.
    nativeState.releaseTimer = window.setTimeout(() => {
      nativeState.releaseTimer = null;
      if (nativeState.listeners.size > 0) return;
      const current = nativeState.host;
      if (!current) return;
      nativeState.activeSlot = null;
      current.remove();
    }, 0);
  };
}

/* ------------------------------------------------------------------ */
/* Social bar                                                          */
/* ------------------------------------------------------------------ */

let socialInitialized = false;
let socialStatus: AdStatus = 'idle';
let adNodeObserverInstalled = false;
const socialListeners = new Set<StatusListener>();

function updateSocialStatus(status: AdStatus): void {
  socialStatus = status;
  notify(socialListeners, status);
}

/**
 * Social Bar scripts inject fixed-position nodes directly into <body>. Mark
 * those nodes for diagnostics so tests and devtools can tell publisher DOM
 * apart from React output. Marking never hides or blocks them.
 */
function installAdNodeObserver(): void {
  if (adNodeObserverInstalled || typeof MutationObserver === 'undefined') return;
  adNodeObserverInstalled = true;

  const mark = (node: Node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.id === 'root' || node.closest('#root')) return;
    node.dataset.wepoAdNode = 'true';
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) mark(node);
    }
  });

  observer.observe(document.body, { childList: true });
  observer.observe(document.documentElement, { childList: true });
}

/**
 * Load the Social Bar at most once per document lifecycle. Callers may unmount
 * and remount during SPA navigation; the module flag and the DOM script check
 * keep a second copy from being initialized.
 */
export function ensureSocialBar(listener?: StatusListener): () => void {
  if (listener) {
    socialListeners.add(listener);
    listener(socialStatus);
  }

  if (!socialInitialized) {
    socialInitialized = true;
    installAdNodeObserver();

    if (document.querySelector('script[data-wepo-social-bar]')) {
      updateSocialStatus('loaded');
    } else {
      updateSocialStatus('loading');
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.cfasync = 'false';
      script.dataset.wepoSocialBar = SOCIAL_BAR.scriptSrc;
      script.src = SOCIAL_BAR.scriptSrc;
      script.addEventListener('load', () => updateSocialStatus('loaded'), { once: true });
      script.addEventListener('error', () => updateSocialStatus('failed'), { once: true });
      document.body.appendChild(script);
    }
  }

  let cleanedUp = false;
  return () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (listener) socialListeners.delete(listener);
  };
}

export function getSocialBarStatus(): AdStatus {
  return socialStatus;
}

/* ------------------------------------------------------------------ */
/* COEP compatibility                                                  */
/* ------------------------------------------------------------------ */

let iframePatchUsers = 0;
let originalCreateElement: typeof document.createElement | null = null;

/**
 * COEP `credentialless` loads third-party creatives and pixels without CORP
 * headers while keeping cross-origin isolation for SharedArrayBuffer. Some
 * browsers still require the `credentialless` attribute on ad iframes, so
 * AdManager installs this patch once while advertising is enabled.
 */
export function installCredentiallessIframePatch(): () => void {
  if (typeof document === 'undefined') return () => {};

  iframePatchUsers += 1;

  if (iframePatchUsers === 1) {
    originalCreateElement = document.createElement.bind(document) as typeof document.createElement;
    document.createElement = function createElement(
      this: Document,
      tagName: string,
      options?: ElementCreationOptions,
    ): HTMLElement {
      const element = originalCreateElement!(tagName, options);
      if (String(tagName).toLowerCase() === 'iframe') {
        try {
          (element as HTMLIFrameElement).credentialless = true;
        } catch {
          // Older browsers ignore the attribute; COEP handling is unchanged.
        }
      }
      return element;
    } as typeof document.createElement;
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    iframePatchUsers = Math.max(0, iframePatchUsers - 1);
    if (iframePatchUsers === 0 && originalCreateElement) {
      document.createElement = originalCreateElement;
      originalCreateElement = null;
    }
  };
}
