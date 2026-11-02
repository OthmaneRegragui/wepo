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
  // COEP require-corp blocks no-cors cross-origin scripts. The publisher
  // endpoints return Access-Control-Allow-Origin: *, so request CORS mode.
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
  entry.cancelScriptWait?.();
  entry.cancelScriptWait = null;
  releaseOptions(entry);
  entry.script?.remove();
  entry.script = null;
  entry.container.replaceChildren();
  delete entry.container.dataset.wepoAdStatus;
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

interface NativeEntry {
  container: HTMLElement;
  listeners: Set<StatusListener>;
  status: AdStatus;
  script: HTMLScriptElement | null;
  cancelScriptWait: (() => void) | null;
  destroyTimer: number | null;
  cancelled: boolean;
}

const nativeEntries = new WeakMap<HTMLElement, NativeEntry>();

function updateNativeStatus(entry: NativeEntry, status: AdStatus): void {
  entry.status = status;
  setContainerStatus(entry.container, status);
  notify(entry.listeners, status);
}

async function runNativeBanner(entry: NativeEntry): Promise<void> {
  if (entry.cancelled || !entry.container.isConnected) return;

  updateNativeStatus(entry, 'loading');
  entry.container.replaceChildren();

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset.cfasync = 'false';
  script.dataset.wepoNativeKey = NATIVE_BANNER.key;
  script.src = NATIVE_BANNER.scriptSrc;
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
    const timeout = window.setTimeout(() => finish(false), NATIVE_SCRIPT_TIMEOUT_MS);
    entry.cancelScriptWait = () => finish(false);
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
  });

  entry.container.appendChild(script);

  const loaded = await result;
  entry.cancelScriptWait = null;

  if (entry.cancelled) {
    script.remove();
    return;
  }

  if (!loaded) {
    script.remove();
    updateNativeStatus(entry, 'failed');
    return;
  }

  updateNativeStatus(entry, 'loaded');
}

function destroyNativeEntry(entry: NativeEntry): void {
  entry.cancelled = true;
  entry.cancelScriptWait?.();
  entry.cancelScriptWait = null;
  entry.script?.remove();
  entry.script = null;
  entry.container.replaceChildren();
  delete entry.container.dataset.wepoAdStatus;
}

/** Mount the native banner script after its dedicated container is in the DOM. */
export function mountNativeBanner(container: HTMLElement, listener?: StatusListener): () => void {
  let entry = nativeEntries.get(container);

  if (!entry) {
    entry = {
      container,
      listeners: new Set(),
      status: 'idle',
      script: null,
      cancelScriptWait: null,
      destroyTimer: null,
      cancelled: false,
    };
    nativeEntries.set(container, entry);
    void runNativeBanner(entry);
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
      if (nativeEntries.get(container) !== entry) return;
      nativeEntries.delete(container);
      destroyNativeEntry(entry);
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
 * those nodes so the editor-route CSS guard can hide them immediately when the
 * user navigates from the home page into an editor.
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
 * Load the Social Bar at most once per page session. Callers may unmount and
 * remount during SPA navigation; the module flag and the DOM script check keep
 * a second copy from being initialized.
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
 * COEP `require-corp` blocks ordinary cross-origin iframes. Ads create their
 * frames with `document.createElement('iframe')`; setting the `credentialless`
 * attribute keeps those frames loading without removing COOP/COEP or breaking
 * SharedArrayBuffer. The patch exists only while an ad surface is mounted.
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
