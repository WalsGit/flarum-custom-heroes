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

/**
 * Single source of truth for the names of the image files stored by the
 * extension, relative to the root of the `flarum-assets` disk.
 */
final class ImagePaths
{
    public const DIRECTORY = 'extensions/walsgit-custom-heroes';

    /**
     * Widths generated for background images, in pixels, ascending.
     */
    public const BACKGROUND_WIDTHS = [640, 1024, 1440, 1920];

    public const ID_PATTERN = '/^[a-f0-9]{16}$/';

    public static function background(string $id, int $width): string
    {
        return self::DIRECTORY."/bg-$id-$width.webp";
    }

    public static function logo(string $id): string
    {
        return self::DIRECTORY."/logo-$id.webp";
    }
}
