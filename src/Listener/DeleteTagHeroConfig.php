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
 * Removes the hero config and images of a tag when the tag is deleted (only
 * registered when flarum/tags is enabled).
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
        $tagId = (string) $event->tag->id;

        $this->configs->delete(Scope::Tag, $tagId);
        $this->images->cleanup(Scope::Tag, $tagId, []);
    }
}
