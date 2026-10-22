import Phaser from 'phaser';
import type { Profile } from '../core/profile';

/**
 * The player's picture: a built-in commander portrait, or a photo they picked. Photos are cropped to a
 * small square JPEG and kept in local storage on the device only (see the Privacy Policy).
 */

const PHOTO_KEY = 'fold-warfare/avatar-photo/v1';
export const PHOTO_TEXTURE = 'avatar_photo';
const PHOTO_SIZE = 256;

export const PRESET_AVATARS = ['avatar_player', 'avatar_viper', 'avatar_blitz', 'avatar_kobra', 'avatar_boomer', 'avatar_bruno', 'avatar_mango', 'avatar_fizz'];

export const playerAvatarKey = (scene: Phaser.Scene, profile: Profile): string => {
  if (profile.avatar === 'photo' && scene.textures.exists(PHOTO_TEXTURE)) return PHOTO_TEXTURE;
  if (scene.textures.exists(profile.avatar)) return profile.avatar;
  return scene.textures.exists('avatar_player') ? 'avatar_player' : 'mortar_P1';
};

const readStoredPhoto = (): string | undefined => {
  try {
    return localStorage.getItem(PHOTO_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

/** Registers the stored photo as a texture (call once at boot, and after picking a new photo). */
export const loadPhotoTexture = (scene: Phaser.Scene, dataUrl = readStoredPhoto()): Promise<void> =>
  new Promise((resolve) => {
    if (!dataUrl) {
      resolve();
      return;
    }
    if (scene.textures.exists(PHOTO_TEXTURE)) scene.textures.remove(PHOTO_TEXTURE);
    const onAdd = (key: string): void => {
      if (key !== PHOTO_TEXTURE) return;
      scene.textures.off(Phaser.Textures.Events.ADD, onAdd);
      resolve();
    };
    scene.textures.on(Phaser.Textures.Events.ADD, onAdd);
    scene.textures.once(Phaser.Textures.Events.ERROR, () => resolve());
    scene.textures.addBase64(PHOTO_TEXTURE, dataUrl);
  });

const cropToSquare = (img: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  return canvas.toDataURL('image/jpeg', 0.85);
};

/** Opens the device photo picker; resolves with a cropped data URL, or undefined if the player cancels. */
export const pickPhoto = (): Promise<string | undefined> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    const finish = (value: string | undefined): void => {
      input.remove();
      resolve(value);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        finish(undefined);
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        finish(cropToSquare(img));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        finish(undefined);
      };
      img.src = url;
    });
    input.addEventListener('cancel', () => finish(undefined));
    input.click();
  });

export const storePhoto = (dataUrl: string): boolean => {
  try {
    localStorage.setItem(PHOTO_KEY, dataUrl);
    return true;
  } catch {
    return false;
  }
};

export const clearPhoto = (): void => {
  try {
    localStorage.removeItem(PHOTO_KEY);
  } catch {
    // Nothing stored or storage blocked: nothing to clear.
  }
};
