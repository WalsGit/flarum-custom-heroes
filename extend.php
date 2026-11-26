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

use Flarum\Api\Context;
use Flarum\Api\Resource\ForumResource;
use Flarum\Api\Schema;
use Flarum\Extend;
use Flarum\Extension\Event\Uninstalled;
use Flarum\Tags\Event\Deleting;
use FoF\Pages\Events\PageDeleted;
use TryHackX\AdvancedPages\Event\PageDeleted as AdvancedPageDeleted;
use Walsgit\CustomHeroes\Api\Controller\SaveConfigController;
use Walsgit\CustomHeroes\Api\Controller\UploadImageController;
use Walsgit\CustomHeroes\Api\ForumPayload;
use Walsgit\CustomHeroes\Extend\PruneOrphanTagConfigs;
use Walsgit\CustomHeroes\Image\UploadLimits;
use Walsgit\CustomHeroes\Listener\DeletePageHeroConfig;
use Walsgit\CustomHeroes\Listener\DeleteTagHeroConfig;
use Walsgit\CustomHeroes\Listener\PruneTagConfigsOnTagsUninstall;
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
        ->post('/walsgit-custom-heroes/configs', 'walsgit-custom-heroes.configs.save', SaveConfigController::class)
        ->post('/walsgit-custom-heroes/images', 'walsgit-custom-heroes.images.upload', UploadImageController::class),

    (new Extend\ApiResource(ForumResource::class))
        ->fields(fn () => [
            Schema\Arr::make('walsgitCustomHeroes')
                ->get(fn () => resolve(ForumPayload::class)()),
            // For the admin page only.
            Schema\Arr::make('walsgitCustomHeroesUpload')
                ->visible(fn ($model, Context $context) => $context->getActor()->isAdmin())
                ->get(fn () => resolve(UploadLimits::class)()),
        ]),

    // Tag configs left behind while the extension was disabled, or by uninstalling flarum/tags.
    new PruneOrphanTagConfigs(),
    (new Extend\Event())
        ->listen(Uninstalled::class, PruneTagConfigsOnTagsUninstall::class),

    // flarum/tags is optional: tag related extenders only apply when enabled.
    (new Extend\Conditional())
        ->whenExtensionEnabled('flarum-tags', fn () => [
            (new Extend\Event())
                ->listen(Deleting::class, DeleteTagHeroConfig::class),
        ]),

    // fof/pages is optional too: the config of a page goes with it.
    (new Extend\Conditional())
        ->whenExtensionEnabled('fof-pages', fn () => [
            (new Extend\Event())
                ->listen(PageDeleted::class, DeletePageHeroConfig::class),
        ]),
    (new Extend\Conditional())
        ->whenExtensionEnabled('tryhackx-advanced-pages', fn () => [
            (new Extend\Event())
                ->listen(AdvancedPageDeleted::class, DeletePageHeroConfig::class),
        ]),
];
