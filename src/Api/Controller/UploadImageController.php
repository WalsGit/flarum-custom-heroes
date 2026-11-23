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
use Laminas\Diactoros\UploadedFile;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Walsgit\CustomHeroes\Config\ConfigRepository;
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Image\HeroImages;
use Walsgit\CustomHeroes\Image\ImageUploadValidator;
use Walsgit\CustomHeroes\Image\RemoteImageFetcher;

/**
 * `POST /api/walsgit-custom-heroes/images`
 *
 * Multipart: `image` (file), `kind` (`background` | `logo`), `scope`, `scopeId`.
 * Or JSON: `{ "url": "https://…", "kind", "scope", "scopeId" }`: the image is
 * downloaded once, through the SSRF-hardened fetcher, then handled like an
 * upload.
 *
 * Returns the `ImageRef` to put in the config. The image is not used until
 * the config is saved; a previous upload that was never saved is removed.
 */
final class UploadImageController implements RequestHandlerInterface
{
    /** Upload kind => file kind (prefix of the file names). */
    private const KINDS = ['background' => 'bg', 'logo' => 'logo'];
    private const URL_MAX_LENGTH = 255;

    public function __construct(
        private readonly ImageUploadValidator $validator,
        private readonly HeroImages $images,
        private readonly ConfigRepository $configs,
        private readonly RemoteImageFetcher $fetcher,
        private readonly TranslatorInterface $translator,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $body = (array) $request->getParsedBody();
        [$scope, $scopeId] = Scope::fromBody($body, $this->translator);

        $kind = $body['kind'] ?? null;

        if (! is_string($kind) || ! isset(self::KINDS[$kind])) {
            $this->fail('kind', 'invalid_value');
        }

        $file = $request->getUploadedFiles()['image'] ?? null;
        $download = null;

        try {
            if (! $file instanceof UploadedFileInterface) {
                $download = (string) tempnam(sys_get_temp_dir(), 'wch');
                $file = $this->download($body['url'] ?? null, $download);
            }

            $this->validator->assertImageValid('image', $file);

            // Keeps at most two versions per hero and kind: the saved one and this upload
            // (an unsaved upload of the other kind is kept).
            $saved = $this->configs->all()[ConfigRepository::key($scope->value, $scopeId)] ?? [];
            $this->images->cleanup($scope, $scopeId, $saved, self::KINDS[$kind]);

            try {
                $contents = (string) $file->getStream();
                $ref = $kind === 'logo'
                    ? $this->images->storeLogo($scope, $scopeId, $contents)
                    : $this->images->storeBackground($scope, $scopeId, $contents);
            } catch (ImageException) {
                $this->fail('image', 'image_processing_failed');
            }
        } finally {
            // Our own temporary file, created above.
            if ($download !== null && $download !== '') {
                @unlink($download);
            }
        }

        return new JsonResponse($ref);
    }

    /**
     * Downloads the image at $url into $path, wrapped as an uploaded file so
     * that it goes through the same validation as an upload.
     */
    private function download(mixed $url, string $path): UploadedFileInterface
    {
        if ($url === null) {
            $this->fail('image', 'missing_key');
        }

        if (! is_string($url) || $url === '' || strlen($url) > self::URL_MAX_LENGTH) {
            $this->fail('url', 'invalid_value');
        }

        if ($path === '' || ! $this->fetcher->download($url, $path)) {
            $this->fail('url', 'image_download_failed');
        }

        // The real type is checked again by the validator, this only feeds the core checks.
        $mime = (@getimagesize($path) ?: [])['mime'] ?? 'application/octet-stream';

        return new UploadedFile($path, (int) filesize($path), UPLOAD_ERR_OK, 'remote-image', $mime);
    }

    private function fail(string $path, string $error): never
    {
        throw new ValidationException([
            $path => $this->translator->trans("walsgit-custom-heroes.api.validation.$error", ['path' => $path]),
        ]);
    }
}
