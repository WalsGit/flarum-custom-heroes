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
use Walsgit\CustomHeroes\Config\OrphanTagConfigs;

/**
 * Uninstalling flarum/tags drops its table: the configs of its tags are
 * removed, since new tags would get their ids again.
 */
final class PruneTagConfigsOnTagsUninstall
{
    public function __construct(
        private readonly OrphanTagConfigs $orphans,
        private readonly DeleteTagHeroConfig $deleter,
    ) {
    }

    public function handle(Uninstalled $event): void
    {
        if ($event->extension->getId() === 'flarum-tags') {
            foreach ($this->orphans->ids() as $id) {
                $this->deleter->delete($id);
            }
        }
    }
}
