import Phaser from 'phaser';

/**
 * Generated art lives in public/assets (built by `npm run assets`) and is listed in manifest.json.
 * Everything here is optional: a missing image falls back to a procedural texture, so the game always runs.
 */

type ManifestEntry = { path: string; w: number; h: number; grid?: [number, number] };
type Manifest = Record<string, ManifestEntry>;

const MANIFEST_KEY = 'asset-manifest';

export const preloadManifest = (scene: Phaser.Scene): void => {
  scene.load.json(MANIFEST_KEY, 'assets/manifest.json');
};

/** Queues every image in the manifest and resolves once they are all loaded. */
export const loadManifestAssets = (scene: Phaser.Scene): Promise<void> =>
  new Promise((resolve) => {
    const manifest = (scene.cache.json.get(MANIFEST_KEY) ?? {}) as Manifest;
    Object.entries(manifest).forEach(([key, entry]) => {
      if (entry.grid) {
        scene.load.spritesheet(key, entry.path, {
          frameWidth: Math.floor(entry.w / entry.grid[0]),
          frameHeight: Math.floor(entry.h / entry.grid[1]),
        });
        return;
      }
      scene.load.image(key, entry.path);
    });
    if (scene.load.list.size === 0) {
      resolve();
      return;
    }
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
    scene.load.start();
  });

/** First texture key in the list that actually exists. */
export const pickTexture = (scene: Phaser.Scene, ...keys: string[]): string => {
  const found = keys.find((k) => scene.textures.exists(k));
  return found ?? keys[keys.length - 1] ?? '__MISSING';
};

export const hasTexture = (scene: Phaser.Scene, key: string): boolean => scene.textures.exists(key);
