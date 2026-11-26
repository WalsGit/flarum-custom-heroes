<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */
namespace Walsgit\CustomHeroes\Listener;

use Flarum\Extension\Event\Uninstalled;
use Walsgit\CustomHeroes\Config\OrphanConfigs;
use Walsgit\CustomHeroes\Image\HeroImages;

/**
 * Uninstalling flarum/tags, fof/pages or tryhackx/flarum-advanced-pages drops
 * its table: the configs of its tags or pages are removed, since new ones
 * would get their ids again.
 */
final class PruneConfigsOnUninstall
{
    public function __construct(
        private readonly OrphanConfigs $orphans,
        private readonly HeroImages $images,
    ) {
    }

    public function handle(Uninstalled $event): void
    {
        $scope = OrphanConfigs::SCOPES[$event->extension->getId()] ?? null;

        if ($scope !== null) {
            $this->orphans->prune($scope, $this->orphans->ids($scope), $this->images);
        }
    }
}
