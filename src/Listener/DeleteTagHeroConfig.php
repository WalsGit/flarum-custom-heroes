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

use Flarum\Tags\Event\Deleting;
use Walsgit\CustomHeroes\Config\ConfigRepository;
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Image\HeroImages;

/**
 * Removes the hero config and images of a tag when the tag is deleted. Only registered
 * when flarum/tags is enabled.
 */
final class DeleteTagHeroConfig
{
    public function __construct(
        private readonly ConfigRepository $configs,
        private readonly HeroImages $images,
    ) {
    }

    public function handle(Deleting $event): void
    {
        $this->configs->delete(Scope::Tag, (string) $event->tag->id);
        $this->images->cleanup(Scope::Tag, (string) $event->tag->id, []);
    }
}
