<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Api\Controller;

use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Http\Message\ServerRequestInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Walsgit\CustomHeroes\Config\ConfigRepository;
use Walsgit\CustomHeroes\Config\ConfigValidator;
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Image\HeroImages;

/**
 * `POST /api/walsgit-custom-heroes/configs`
 *
 * Body: `{ "scope": "welcome", "scopeId": "", "config": { … } | null }`.
 * A null or empty config deletes the stored one (inherit everything).
 */
final class SaveConfigController implements RequestHandlerInterface
{
    public function __construct(
        private readonly ConfigValidator $validator,
        private readonly ConfigRepository $configs,
        private readonly HeroImages $images,
        private readonly TranslatorInterface $translator,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $body = (array) $request->getParsedBody();
        // Checked before the config, so that deleting (null config) needs a valid target.
        [$scope, $scopeId] = Scope::fromBody($body, $this->translator);

        $config = $body['config'] ?? null;
        $config = $config === null ? [] : $this->validator->validate($scope, $scopeId, $config);

        $this->configs->save($scope, $scopeId, $config);
        $this->images->cleanup($scope, $scopeId, $config);

        return new JsonResponse([
            'scope' => $scope->value,
            'scopeId' => $scopeId,
            'config' => (object) $config,
        ]);
    }
}
