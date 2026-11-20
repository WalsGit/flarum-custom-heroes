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

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Intervention\Image\Exceptions\RuntimeException as ImageException;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Walsgit\CustomHeroes\Config\ConfigRepository;
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Image\HeroImages;
use Walsgit\CustomHeroes\Image\ImageUploadValidator;

/**
 * `POST /api/walsgit-custom-heroes/images` (multipart)
 *
 * Fields: `image` (file), `kind` (`background`), `scope`, `scopeId`.
 * Returns the `ImageRef` to put in the config. The image is not used until
 * the config is saved; a previous upload that was never saved is removed.
 */
final class UploadImageController implements RequestHandlerInterface
{
    // shortcut: background only, `logo` comes with the logo section (phase 7).
    private const KINDS = ['background'];

    public function __construct(
        private readonly ImageUploadValidator $validator,
        private readonly HeroImages $images,
        private readonly ConfigRepository $configs,
        private readonly TranslatorInterface $translator,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $body = (array) $request->getParsedBody();
        [$scope, $scopeId] = Scope::fromBody($body, $this->translator);

        if (! in_array($body['kind'] ?? null, self::KINDS, true)) {
            $this->fail('kind', 'invalid_value');
        }

        $file = $request->getUploadedFiles()['image'] ?? null;

        if (! $file instanceof UploadedFileInterface) {
            $this->fail('image', 'missing_key');
        }

        $this->validator->assertImageValid('image', $file);

        // Keeps at most two versions per hero: the saved one and this upload.
        $this->images->cleanup($scope, $scopeId, $this->configs->all()[ConfigRepository::key($scope->value, $scopeId)] ?? []);

        try {
            $ref = $this->images->storeBackground($scope, $scopeId, (string) $file->getStream());
        } catch (ImageException) {
            $this->fail('image', 'image_processing_failed');
        }

        return new JsonResponse($ref);
    }

    private function fail(string $path, string $error): never
    {
        throw new ValidationException([
            $path => $this->translator->trans("walsgit-custom-heroes.api.validation.$error", ['path' => $path]),
        ]);
    }
}
