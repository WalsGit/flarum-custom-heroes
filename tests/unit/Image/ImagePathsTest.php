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
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Image\ImagePaths;

class ImagePathsTest extends TestCase
{
    private const ID = '3f2a9c1d7b4e6a05';

    public function test_file_names_include_the_target(): void
    {
        $this->assertSame(ImagePaths::DIRECTORY.'/bg-welcome-'.self::ID.'-1024.webp', ImagePaths::background(Scope::Welcome, '', self::ID, 1024));
        $this->assertSame(ImagePaths::DIRECTORY.'/bg-tag-12-'.self::ID.'-640.webp', ImagePaths::background(Scope::Tag, '12', self::ID, 640));
        $this->assertSame(ImagePaths::DIRECTORY.'/logo-global-'.self::ID.'.webp', ImagePaths::logo(Scope::Global, '', self::ID));
    }

    public function test_target_pattern_only_matches_the_files_of_its_target(): void
    {
        $tagType = ImagePaths::targetPattern(Scope::Tag, '');
        $tag12 = ImagePaths::targetPattern(Scope::Tag, '12');
        $name = fn (string $path) => basename($path);

        $this->assertSame(1, preg_match($tagType, $name(ImagePaths::background(Scope::Tag, '', self::ID, 640))));
        $this->assertSame(1, preg_match($tagType, $name(ImagePaths::logo(Scope::Tag, '', self::ID))));
        $this->assertSame(0, preg_match($tagType, $name(ImagePaths::background(Scope::Tag, '12', self::ID, 640))));

        $this->assertSame(1, preg_match($tag12, $name(ImagePaths::background(Scope::Tag, '12', self::ID, 640)), $match));
        $this->assertSame(['bg', self::ID], [$match[1], $match[2]]);
        $this->assertSame(0, preg_match($tag12, $name(ImagePaths::background(Scope::Tag, '123', self::ID, 640))));
        $this->assertSame(0, preg_match($tag12, $name(ImagePaths::background(Scope::Tag, '', self::ID, 640))));
        $this->assertSame(0, preg_match($tag12, 'bg-tag-12-'.self::ID.'-640.webp.php'));
    }
}
