import { FoldNative, isNativeIOS, type HingeInfo } from './native';

/**
 * Detects the iPhone Duo being folded shut so the battle can play on the outer (back) screen.
 *
 * Signals, strongest first:
 *  1. Apple's hinge API (UIHingeInteraction, iOS 27.1+) via the native plugin: status closed / open.
 *  2. The web Device Posture API (`navigator.devicePosture`: 'folded' | 'continuous').
 *  3. Screen-change heuristic: folding moves the app from the large inner display to the smaller outer
 *     one, so the viewport shrinks sharply. That works even with no posture API at all.
 * The game always keeps a manual FOLD button too, so it also plays on regular iPhones.
 */

export type Posture = 'unfolded' | 'folded';
type Listener = (posture: Posture) => void;

type DevicePosture = EventTarget & { type: 'folded' | 'continuous' };
const devicePosture = (): DevicePosture | undefined => (navigator as Navigator & { devicePosture?: DevicePosture }).devicePosture;

/** The inner display is much larger than the cover display; a drop this big means "moved to the outer screen". */
const AREA_DROP_RATIO = 0.7;

class FoldSensor {
  private listeners = new Set<Listener>();
  private baselineArea = window.innerWidth * window.innerHeight;
  private posture: Posture = 'unfolded';
  private hingeSeen = false;

  constructor() {
    window.addEventListener('resize', () => this.checkViewport());
    window.addEventListener('foldwarfare:posture', (e) => {
      const detail = (e as CustomEvent<{ posture: Posture }>).detail;
      if (detail?.posture) this.set(detail.posture);
    });
    devicePosture()?.addEventListener('change', () => this.set(devicePosture()?.type === 'folded' ? 'folded' : 'unfolded'));
  }

  get current(): Posture {
    return this.posture;
  }

  /** Remember the current (unfolded) screen size as the reference before asking the player to fold. */
  arm(): void {
    this.baselineArea = window.innerWidth * window.innerHeight;
    this.posture = 'unfolded';
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private checkViewport(): void {
    const area = window.innerWidth * window.innerHeight;
    if (area < this.baselineArea * AREA_DROP_RATIO) this.set('folded');
    else if (area > this.baselineArea * 0.95) this.set('unfolded');
  }

  /** Feed Apple's hinge status (from the native plugin) into the sensor. */
  applyHinge(info: HingeInfo): void {
    if (!info.available) {
      // The hinge only reports on the inner display; losing it after it was reporting means the app moved to the outer screen.
      if (this.hingeSeen) this.set('folded');
      return;
    }
    this.hingeSeen = true;
    if (info.status === 'closed') this.set('folded');
    else if (info.status === 'fullyOpen' || info.status === 'partiallyOpen') this.set('unfolded');
  }

  private set(next: Posture): void {
    if (next === this.posture) return;
    this.posture = next;
    this.listeners.forEach((l) => l(next));
  }
}

export const foldSensor = new FoldSensor();

/** Call once at launch inside the iOS app. */
export const connectNativeHinge = async (): Promise<void> => {
  if (!isNativeIOS()) return;
  await FoldNative.addListener('hinge', (info) => foldSensor.applyHinge(info));
  foldSensor.applyHinge(await FoldNative.getHinge().catch((): HingeInfo => ({ available: false, status: 'unknown', angle: 0 })));
};
