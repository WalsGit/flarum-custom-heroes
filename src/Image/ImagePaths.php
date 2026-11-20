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

use Walsgit\CustomHeroes\Config\Scope;

/**
 * Single source of truth for the names of the image files stored by the
 * extension, relative to the root of the `flarum-assets` disk.
 *
 * Files belong to the hero they were uploaded for (its target: scope and
 * scope id) and carry a version id: `bg-tag-12-{id}-1024.webp`.
 */
final class ImagePaths
{
    public const DIRECTORY = 'extensions/walsgit-custom-heroes';

    /**
     * Widths generated for background images, in pixels, ascending.
     */
    public const BACKGROUND_WIDTHS = [640, 1024, 1440, 1920];

    public const ID_PATTERN = '/^[a-f0-9]{16}$/';

    public static function background(Scope $scope, string $scopeId, string $id, int $width): string
    {
        return self::DIRECTORY.'/bg-'.self::target($scope, $scopeId)."-$id-$width.webp";
    }

    public static function logo(Scope $scope, string $scopeId, string $id): string
    {
        return self::DIRECTORY.'/logo-'.self::target($scope, $scopeId)."-$id.webp";
    }

    /**
     * Matches the file names (without directory) of a target. Captures the
     * kind (`bg` or `logo`) and the image id. Anchored: `bg-tag-…` (all tag
     * heroes) never matches `bg-tag-12-…` (the hero of tag 12).
     */
    public static function targetPattern(Scope $scope, string $scopeId): string
    {
        return '/^(bg|logo)-'.preg_quote(self::target($scope, $scopeId), '/').'-([a-f0-9]{16})(?:-[0-9]+)?\.webp$/';
    }

    private static function target(Scope $scope, string $scopeId): string
    {
        return $scopeId === '' ? $scope->value : "$scope->value-$scopeId";
    }
}
