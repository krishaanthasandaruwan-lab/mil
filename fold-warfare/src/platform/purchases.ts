import { COIN_PACKS, GEM_PACKS, buyPack, unlockFullGame, type MoneyPack } from '../core/economy';
import { updateProfile } from '../core/profile';
import { FoldNative, isNativeIOS } from './native';

/**
 * Real-money purchases. In the iOS app these go through the App Store (StoreKit 2); in the browser build
 * they are simulated so the game can be tested without a store. Product IDs must match App Store Connect.
 */

export const UNLOCK_PRODUCT = 'com.foldwarfare.game.unlock';
const PACK_PRODUCTS: Record<string, string> = {
  coins_s: 'com.foldwarfare.game.coins.small',
  coins_m: 'com.foldwarfare.game.coins.medium',
  coins_l: 'com.foldwarfare.game.coins.large',
  gems_s: 'com.foldwarfare.game.gems.small',
  gems_m: 'com.foldwarfare.game.gems.medium',
  gems_l: 'com.foldwarfare.game.gems.large',
};

export const ALL_PRODUCT_IDS = [UNLOCK_PRODUCT, ...Object.values(PACK_PRODUCTS)];

export const isTestStore = (): boolean => !isNativeIOS();

const localizedPrices = new Map<string, string>();

/** Store-localized price ("Rs 1,100.00", "$4.99"…) when available, else the default USD label. */
export const priceOf = (productId: string, fallback: string): string => localizedPrices.get(productId) ?? fallback;
export const packProductId = (pack: MoneyPack): string => PACK_PRODUCTS[pack.id] ?? pack.id;

const grant = (productId: string): void => {
  if (productId === UNLOCK_PRODUCT) {
    updateProfile(unlockFullGame);
    return;
  }
  const pack = [...COIN_PACKS, ...GEM_PACKS].find((p) => PACK_PRODUCTS[p.id] === productId);
  if (pack) updateProfile((p) => buyPack(p, pack));
};

let started = false;

/** Load prices and start listening for purchases completed outside the purchase sheet (Ask to Buy etc.). */
export const initPurchases = async (onGranted: () => void): Promise<void> => {
  if (!isNativeIOS() || started) return;
  started = true;
  await FoldNative.addListener('purchaseUpdated', ({ productId }) => {
    grant(productId);
    onGranted();
  });
  try {
    const { products } = await FoldNative.getProducts({ productIds: ALL_PRODUCT_IDS });
    products.forEach((p) => localizedPrices.set(p.id, p.displayPrice));
  } catch {
    // Store unreachable (offline / not configured yet): default prices stay visible, purchases will retry.
  }
};

export type BuyOutcome = 'granted' | 'cancelled' | 'pending' | 'failed';

export const buyProduct = async (productId: string): Promise<BuyOutcome> => {
  if (!isNativeIOS()) {
    grant(productId);
    return 'granted';
  }
  try {
    const result = await FoldNative.purchase({ productId });
    if (result.status === 'purchased') {
      grant(productId);
      return 'granted';
    }
    return result.status === 'pending' ? 'pending' : 'cancelled';
  } catch {
    return 'failed';
  }
};

/** Re-applies non-consumables (the full-game unlock) on a new device or after reinstalling. */
export const restorePurchases = async (): Promise<boolean> => {
  if (!isNativeIOS()) return false;
  try {
    const { productIds } = await FoldNative.restorePurchases();
    if (!productIds.includes(UNLOCK_PRODUCT)) return false;
    grant(UNLOCK_PRODUCT);
    return true;
  } catch {
    return false;
  }
};
