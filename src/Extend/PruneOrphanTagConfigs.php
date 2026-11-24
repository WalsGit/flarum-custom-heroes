<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */
namespace Walsgit\CustomHeroes\Extend;

use Flarum\Extend\ExtenderInterface;
use Flarum\Extend\LifecycleInterface;
use Flarum\Extension\Extension;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Filesystem\Factory;
use Walsgit\CustomHeroes\Config\OrphanTagConfigs;
use Walsgit\CustomHeroes\Image\HeroImages;
use Walsgit\CustomHeroes\Listener\DeleteTagHeroConfig;

/**
 * When the extension is enabled, removes the configs of the tags deleted
 * while it was disabled (its tag listeners could not run).
 */
final class PruneOrphanTagConfigs implements ExtenderInterface, LifecycleInterface
{
    public function extend(Container $container, ?Extension $extension = null): void
    {
    }

    public function onEnable(Container $container, Extension $extension): void
    {
        $ids = $container->make(OrphanTagConfigs::class)->ids();

        // The assets disk is only resolved when needed: doing it while extensions are enabled at boot (tests) breaks it.
        if ($ids === []) {
            return;
        }

        // The extension's service provider has not run yet in this request: the assets disk is given here.
        $images = $container->make(HeroImages::class, ['assets' => $container->make(Factory::class)->disk('flarum-assets')]);
        $deleter = $container->make(DeleteTagHeroConfig::class, ['images' => $images]);

        foreach ($ids as $id) {
            $deleter->delete($id);
        }
    }

    public function onDisable(Container $container, Extension $extension): void
    {
    }
}
