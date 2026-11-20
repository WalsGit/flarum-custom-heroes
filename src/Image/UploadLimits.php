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

use Intervention\Image\Format;
use Intervention\Image\ImageManager;

/**
 * What the admin needs to know before uploading: the effective maximum size
 * and whether the server can encode WebP at all.
 */
final class UploadLimits
{
    public function __construct(
        private readonly ImageManager $manager,
    ) {
    }

    /**
     * @return array{maxSize: int, webp: bool}
     */
    public function __invoke(): array
    {
        return [
            'maxSize' => self::maxSize(),
            'webp' => $this->manager->driver()->supports(Format::WEBP),
        ];
    }

    /**
     * Our own limit, capped by PHP's: a larger upload never reaches the
     * extension. In bytes.
     */
    public static function maxSize(): int
    {
        $limits = [
            ImageUploadValidator::MAX_SIZE_KB * 1024,
            self::bytes(ini_get('upload_max_filesize')),
            self::bytes(ini_get('post_max_size')),
        ];

        // 0 (or less) means "no limit" for PHP.
        return min(array_filter($limits, fn (int $limit) => $limit > 0));
    }

    /**
     * Converts a php.ini size (`2M`, `512K`, `1G`, `1048576`) to bytes.
     */
    public static function bytes(string|false $value): int
    {
        $value = trim((string) $value);
        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g' => $number * 1024 ** 3,
            'm' => $number * 1024 ** 2,
            'k' => $number * 1024,
            default => $number,
        };
    }
}
