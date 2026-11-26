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
use Walsgit\CustomHeroes\Config\OrphanConfigs;
use Walsgit\CustomHeroes\Image\HeroImages;

/**
 * When the extension is enabled, removes the configs of the tags and pages
 * deleted while it was disabled (its delete listeners could not run).
 */
final class PruneOrphanConfigs implements ExtenderInterface, LifecycleInterface
{
    public function extend(Container $container, ?Extension $extension = null): void
    {
    }

    public function onEnable(Container $container, Extension $extension): void
    {
        $orphans = $container->make(OrphanConfigs::class);
        $ids = array_map(fn ($scope) => $orphans->ids($scope), OrphanConfigs::SCOPES);

        // The assets disk is only resolved when needed: doing it while extensions are enabled at boot (tests) breaks it.
        if (array_merge(...array_values($ids)) === []) {
            return;
        }

        // The extension's service provider has not run yet in this request: the assets disk is given here.
        $images = $container->make(HeroImages::class, ['assets' => $container->make(Factory::class)->disk('flarum-assets')]);

        foreach (OrphanConfigs::SCOPES as $extensionId => $scope) {
            $orphans->prune($scope, $ids[$extensionId], $images);
        }
    }

    public function onDisable(Container $container, Extension $extension): void
    {
    }
}
