<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Providers;

use Flarum\Foundation\AbstractServiceProvider;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Contracts\Filesystem\Filesystem;
use Walsgit\CustomHeroes\Config\ConfigValidator;
use Walsgit\CustomHeroes\Image\HeroImages;

class CustomHeroesServiceProvider extends AbstractServiceProvider
{
    public function register(): void
    {
        // Hero images live on the assets disk.
        $this->container->when([ConfigValidator::class, HeroImages::class])
            ->needs(Filesystem::class)
            ->give(fn () => $this->container->make(Factory::class)->disk('flarum-assets'));
    }
}
