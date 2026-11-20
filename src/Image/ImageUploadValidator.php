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

use Flarum\Foundation\AbstractImageValidator;
use Psr\Http\Message\UploadedFileInterface;

/**
 * Validates an uploaded hero image with the core checks (upload errors, byte
 * size before decoding, decompression bombs, decodable image), plus:
 * the real type of the file and the size of each side.
 */
final class ImageUploadValidator extends AbstractImageValidator
{
    private const MAX_SIDE = 4000;

    protected function assertFileMimes(UploadedFileInterface $file): void
    {
        // The core trusts the type announced by the client: check the real one.
        $info = @getimagesizefromstring((string) $file->getStream());

        if ($info === false || ! in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            $this->raise('mimes', [':values' => implode(', ', $this->getAllowedTypes())]);
        } elseif ($info[0] > self::MAX_SIDE || $info[1] > self::MAX_SIDE) {
            $this->raise('dimensions');
        }

        parent::assertFileMimes($file);
    }

    public function getMaxSize(): int
    {
        return 5 * 1024; // KB
    }

    public function getMaxResolution(): int
    {
        return self::MAX_SIDE * self::MAX_SIDE;
    }

    protected function getAllowedTypes(): array
    {
        return ['jpeg', 'jpg', 'png', 'webp'];
    }
}
