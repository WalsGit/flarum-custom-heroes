<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Image;

use Illuminate\Contracts\Filesystem\Filesystem;
use Intervention\Image\ImageManager;
use Walsgit\CustomHeroes\Config\Scope;

/**
 * Stores the images of a hero on the `flarum-assets` disk and removes the ones
 * its config no longer uses. Cleanup is local to one hero: it never touches
 * the files of another target.
 */
final class HeroImages
{
    private const BACKGROUND_QUALITY = 80;

    private const LOGO_QUALITY = 90;

    /** Twice the largest displayed height (128 px), for high density screens. */
    public const LOGO_MAX_HEIGHT = 256;

    public function __construct(
        private readonly Filesystem $assets,
        private readonly ImageManager $manager,
    ) {
    }

    /**
     * Re-encodes an already validated image to WebP, in every background width
     * up to its own (never upscaled).
     *
     * @return array{id: string, width: int, height: int, widths: list<int>} the `ImageRef`
     *
     * @throws \Intervention\Image\Exceptions\RuntimeException
     */
    public function storeBackground(Scope $scope, string $scopeId, string $contents): array
    {
        // Same content, same id: uploading the same image again is harmless.
        $id = substr(hash('sha256', $contents), 0, 16);
        $image = $this->manager->read($contents);

        if ($image->isAnimated()) {
            $image->removeAnimation();
        }

        $widths = array_values(array_filter(ImagePaths::BACKGROUND_WIDTHS, fn (int $width) => $width <= $image->width()));
        // A narrower source is kept at its own size in the smallest file: CSS stretches it to cover the hero.
        $widths = $widths === [] ? [ImagePaths::BACKGROUND_WIDTHS[0]] : $widths;

        $ref = null;

        // Largest first, on the same image, so that only one bitmap is in memory.
        foreach (array_reverse($widths) as $width) {
            $image->scaleDown(width: $width);
            $ref ??= ['id' => $id, 'width' => $image->width(), 'height' => $image->height(), 'widths' => $widths];

            $this->assets->put(
                ImagePaths::background($scope, $scopeId, $id, $width),
                (string) $image->toWebp(quality: self::BACKGROUND_QUALITY, strip: true)
            );
        }

        return $ref;
    }

    /**
     * Re-encodes an already validated logo to WebP, keeping its transparency,
     * at most LOGO_MAX_HEIGHT high (never upscaled).
     *
     * @return array{id: string, width: int, height: int} the `ImageRef`
     *
     * @throws \Intervention\Image\Exceptions\RuntimeException
     */
    public function storeLogo(Scope $scope, string $scopeId, string $contents): array
    {
        $id = substr(hash('sha256', $contents), 0, 16);
        $image = $this->manager->read($contents);

        if ($image->isAnimated()) {
            $image->removeAnimation();
        }

        $image->scaleDown(height: self::LOGO_MAX_HEIGHT);

        $this->assets->put(
            ImagePaths::logo($scope, $scopeId, $id),
            (string) $image->toWebp(quality: self::LOGO_QUALITY, strip: true)
        );

        return ['id' => $id, 'width' => $image->width(), 'height' => $image->height()];
    }

    /**
     * Deletes the files of a target that its config does not reference. An
     * empty config deletes all of them. With a kind (`bg` or `logo`), only the
     * files of that kind are considered.
     *
     * @param array<string, mixed> $config
     */
    public function cleanup(Scope $scope, string $scopeId, array $config, ?string $kind = null): void
    {
        $keep = [
            'bg' => self::imageId($config['background'] ?? null),
            'logo' => self::imageId($config['logo'] ?? null),
        ];
        $pattern = ImagePaths::targetPattern($scope, $scopeId);

        foreach ($this->assets->files(ImagePaths::DIRECTORY) as $path) {
            if (preg_match($pattern, basename($path), $match) === 1 && ($kind === null || $kind === $match[1]) && $keep[$match[1]] !== $match[2]) {
                $this->assets->delete($path);
            }
        }
    }

    private static function imageId(mixed $section): ?string
    {
        $id = is_array($section) && is_array($section['image'] ?? null) ? ($section['image']['id'] ?? null) : null;

        return is_string($id) ? $id : null;
    }
}
