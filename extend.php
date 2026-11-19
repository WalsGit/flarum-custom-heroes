<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes;

use Flarum\Api\Resource\ForumResource;
use Flarum\Api\Schema;
use Flarum\Extend;
use Flarum\Tags\Event\Deleting;
use Walsgit\CustomHeroes\Api\Controller\SaveConfigController;
use Walsgit\CustomHeroes\Api\ForumPayload;
use Walsgit\CustomHeroes\Listener\DeleteTagHeroConfig;
use Walsgit\CustomHeroes\Providers\CustomHeroesServiceProvider;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),
    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\ServiceProvider())
        ->register(CustomHeroesServiceProvider::class),

    (new Extend\Routes('api'))
        ->post('/walsgit-custom-heroes/configs', 'walsgit-custom-heroes.configs.save', SaveConfigController::class),

    (new Extend\ApiResource(ForumResource::class))
        ->fields(fn () => [
            Schema\Arr::make('walsgitCustomHeroes')
                ->get(fn () => resolve(ForumPayload::class)()),
        ]),

    // flarum/tags is optional: tag related extenders only apply when enabled.
    (new Extend\Conditional())
        ->whenExtensionEnabled('flarum-tags', fn () => [
            (new Extend\Event())
                ->listen(Deleting::class, DeleteTagHeroConfig::class),
        ]),
];
