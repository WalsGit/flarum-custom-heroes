<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Tests\unit\Image;

use Flarum\Testing\unit\TestCase;
use Walsgit\CustomHeroes\Image\UploadLimits;

class UploadLimitsTest extends TestCase
{
    public function test_php_ini_sizes_are_converted_to_bytes(): void
    {
        $this->assertSame(2 * 1024 * 1024, UploadLimits::bytes('2M'));
        $this->assertSame(512 * 1024, UploadLimits::bytes('512k'));
        $this->assertSame(1024 ** 3, UploadLimits::bytes('1G'));
        $this->assertSame(1048576, UploadLimits::bytes('1048576'));
        $this->assertSame(0, UploadLimits::bytes(false));
    }

    public function test_max_size_never_exceeds_the_extension_limit(): void
    {
        $this->assertLessThanOrEqual(5 * 1024 * 1024, UploadLimits::maxSize());
        $this->assertGreaterThan(0, UploadLimits::maxSize());
    }
}
