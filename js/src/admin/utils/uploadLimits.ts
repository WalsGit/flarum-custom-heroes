import app from 'flarum/admin/app';

/** The `walsgitCustomHeroesUpload` forum attribute, only sent to admins. */
export function uploadLimits(): { maxSize: number; webp: boolean } {
  return app.forum.attribute('walsgitCustomHeroesUpload') ?? { maxSize: 2 * 1024 * 1024, webp: true };
}

/** The maximum upload size in MB, for messages (`2`, `1.5`). */
export function maxSizeMb(): string {
  return (uploadLimits().maxSize / 1024 / 1024).toFixed(1).replace(/\.0$/, '');
}
