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

use FoF\Pages\Events\PageDeleted;
use Walsgit\CustomHeroes\Config\ConfigRepository;
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Image\HeroImages;

/**
 * Removes the hero config and images of a fof/pages page when it is deleted
 * (only registered when fof/pages is enabled).
 */
final class DeletePageHeroConfig
{
    public function __construct(
        private readonly ConfigRepository $configs,
        private readonly HeroImages $images,
    ) {
    }

    public function handle(PageDeleted $event): void
    {
        $pageId = (string) $event->page->id;

        $this->configs->delete(Scope::Pages, $pageId);
        $this->images->cleanup(Scope::Pages, $pageId, []);
    }
}
