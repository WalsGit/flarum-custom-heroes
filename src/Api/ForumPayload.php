<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Api;

use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Contracts\Filesystem\Factory;
use LogicException;
use Walsgit\CustomHeroes\Config\ConfigRepository;
use Walsgit\CustomHeroes\Image\ImagePaths;

/**
 * Builds the `walsgitCustomHeroes` forum attribute: everything the frontend
 * needs to render the heroes. It only holds display settings, so it is public.
 */
final class ForumPayload
{
    public function __construct(
        private readonly ConfigRepository $configs,
        private readonly Factory $filesystem,
    ) {
    }

    /**
     * `configs` is keyed by `scope` or `scope:scopeId`. When nothing is
     * configured, the JSON:API serializer sends it as an empty list (`[]`)
     * instead of an empty object: the frontend treats both as "no config".
     *
     * @return array{assetsUrl: string, configs: array<string, array<string, mixed>>}
     */
    public function __invoke(): array
    {
        $assets = $this->filesystem->disk('flarum-assets');

        if (! $assets instanceof Cloud) {
            throw new LogicException('The flarum-assets disk must provide public URLs.');
        }

        return [
            // Built from the disk, so it follows a subdirectory install or a
            // relocated assets folder.
            'assetsUrl' => rtrim($assets->url(ImagePaths::DIRECTORY), '/'),
            'configs' => $this->configs->all(),
        ];
    }
}
