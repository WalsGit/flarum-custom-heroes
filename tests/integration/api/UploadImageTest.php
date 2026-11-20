<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Tests\integration\api;

use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Contracts\Filesystem\Filesystem;
use Laminas\Diactoros\UploadedFile;
use PHPUnit\Framework\Attributes\Test;
use Psr\Http\Message\ResponseInterface;
use Walsgit\CustomHeroes\Image\ImagePaths;

class UploadImageTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    /**
     * @var list<string> temporary files created by the test
     */
    private array $tempFiles = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('walsgit-custom-heroes');

        $this->prepareDatabase([
            'users' => [
                $this->normalUser(),
            ],
        ]);

        $this->assets()->deleteDirectory(ImagePaths::DIRECTORY);
    }

    protected function tearDown(): void
    {
        array_map('unlink', $this->tempFiles);

        parent::tearDown();
    }

    private function tempFile(): string
    {
        return $this->tempFiles[] = (string) tempnam(sys_get_temp_dir(), 'wch');
    }

    private function assets(): Filesystem
    {
        return $this->app()->getContainer()->make(Factory::class)->disk('flarum-assets');
    }

    /**
     * @return list<string> the stored file names
     */
    private function storedFiles(): array
    {
        $files = array_map('basename', $this->assets()->files(ImagePaths::DIRECTORY));
        sort($files);

        return $files;
    }

    private function png(int $width, int $height, int $red = 0): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefill($image, 0, 0, (int) imagecolorallocate($image, $red, 100, 150));
        $path = $this->tempFile();
        imagepng($image, $path);

        return $path;
    }

    /**
     * @param array<string, mixed> $fields
     */
    private function upload(string $path, array $fields = [], int $actorId = 1, string $clientType = 'image/png'): ResponseInterface
    {
        $request = $this->request('POST', '/api/walsgit-custom-heroes/images', ['authenticatedAs' => $actorId])
            ->withParsedBody($fields + ['kind' => 'background', 'scope' => 'welcome', 'scopeId' => ''])
            ->withUploadedFiles(['image' => new UploadedFile($path, (int) filesize($path), UPLOAD_ERR_OK, 'image.png', $clientType)]);

        return $this->send($request);
    }

    /**
     * @param array<string, mixed>|null $config
     */
    private function saveConfig(string $scope, string $scopeId, ?array $config): ResponseInterface
    {
        return $this->send($this->request('POST', '/api/walsgit-custom-heroes/configs', [
            'authenticatedAs' => 1,
            'json' => ['scope' => $scope, 'scopeId' => $scopeId, 'config' => $config],
        ]));
    }

    /**
     * @return array<string, mixed>
     */
    private function body(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true);
    }

    #[Test]
    public function non_admin_cannot_upload(): void
    {
        $this->assertSame(403, $this->upload($this->png(800, 300), [], 2)->getStatusCode());
        $this->assertSame([], $this->storedFiles());
    }

    #[Test]
    public function upload_is_stored_in_every_width_up_to_its_own(): void
    {
        $response = $this->upload($this->png(1500, 500), ['scope' => 'tag', 'scopeId' => '12']);

        $this->assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $ref = $this->body($response);
        $this->assertMatchesRegularExpression(ImagePaths::ID_PATTERN, $ref['id']);
        $this->assertSame(['width' => 1440, 'height' => 480, 'widths' => [640, 1024, 1440]], array_diff_key($ref, ['id' => 0]));

        $expected = array_map(fn (int $width) => "bg-tag-12-{$ref['id']}-$width.webp", [1024, 1440, 640]);
        $this->assertSame($expected, $this->storedFiles());
        $this->assertSame('image/webp', $this->assets()->mimeType(ImagePaths::DIRECTORY."/bg-tag-12-{$ref['id']}-640.webp"));

        // The returned ref is accepted by the config of the same target only.
        $this->assertSame(422, $this->saveConfig('tag', '', ['background' => ['image' => $ref]])->getStatusCode());
        $this->assertSame(200, $this->saveConfig('tag', '12', ['background' => ['image' => $ref]])->getStatusCode());
    }

    #[Test]
    public function narrow_image_is_kept_at_its_own_size(): void
    {
        $ref = $this->body($this->upload($this->png(300, 100)));

        $this->assertSame([300, 100, [640]], [$ref['width'], $ref['height'], $ref['widths']]);
        $this->assertSame(["bg-welcome-{$ref['id']}-640.webp"], $this->storedFiles());
    }

    #[Test]
    public function invalid_uploads_are_rejected(): void
    {
        $text = $this->tempFile();
        file_put_contents($text, '<?php echo "hi";');

        $gif = $this->tempFile();
        imagegif(imagecreatetruecolor(800, 300), $gif);

        $this->assertSame(422, $this->upload($text)->getStatusCode());
        // Real type checked, whatever the client announces.
        $this->assertSame(422, $this->upload($gif)->getStatusCode());
        $this->assertSame(422, $this->upload($this->png(4001, 100))->getStatusCode());
        $this->assertSame(422, $this->upload($this->png(800, 300), ['kind' => 'logo'])->getStatusCode());
        $this->assertSame(422, $this->upload($this->png(800, 300), ['scope' => 'welcome', 'scopeId' => '3'])->getStatusCode());
        $this->assertSame([], $this->storedFiles());
    }

    /**
     * @param array<string, mixed> $json
     */
    private function import(array $json): ResponseInterface
    {
        return $this->send($this->request('POST', '/api/walsgit-custom-heroes/images', [
            'authenticatedAs' => 1,
            'json' => $json + ['kind' => 'background', 'scope' => 'welcome', 'scopeId' => ''],
        ]));
    }

    #[Test]
    public function import_from_a_non_public_or_invalid_url_is_rejected(): void
    {
        foreach (['http://127.0.0.1/x.png', 'http://localhost/x.png', 'javascript:alert(1)', 'https://example.com/'.str_repeat('a', 250)] as $url) {
            $response = $this->import(['url' => $url]);

            $this->assertSame(422, $response->getStatusCode(), $url);
            $this->assertArrayHasKey('url', $this->errors($response), $url);
        }

        $this->assertSame(422, $this->import(['url' => ['https://example.com/x.png']])->getStatusCode());
        // Neither a file nor a URL.
        $this->assertArrayHasKey('image', $this->errors($this->import([])));
        $this->assertSame([], $this->storedFiles());
    }

    /**
     * @return array<string, string> the validation errors keyed by path
     */
    private function errors(ResponseInterface $response): array
    {
        $errors = [];

        foreach ($this->body($response)['errors'] ?? [] as $error) {
            $errors[basename($error['source']['pointer'] ?? '')] = $error['detail'];
        }

        return $errors;
    }

    #[Test]
    public function unsaved_uploads_and_unused_files_are_cleaned_up(): void
    {
        $first = $this->body($this->upload($this->png(700, 300, 1)));
        $second = $this->body($this->upload($this->png(700, 300, 2)));
        $other = $this->body($this->upload($this->png(700, 300, 3), ['scope' => 'global']));

        // The first upload was never saved: replaced by the second one.
        $this->assertNotSame($first['id'], $second['id']);
        $this->assertSame(["bg-global-{$other['id']}-640.webp", "bg-welcome-{$second['id']}-640.webp"], $this->storedFiles());

        // Saving keeps the referenced image only, and leaves other heroes alone.
        $this->saveConfig('welcome', '', ['background' => ['image' => $second]]);
        $third = $this->body($this->upload($this->png(700, 300, 4)));
        $this->assertCount(3, $this->storedFiles());
        $this->assertSame(200, $this->saveConfig('welcome', '', ['height' => ['preset' => 's']])->getStatusCode());
        $this->assertSame(["bg-global-{$other['id']}-640.webp"], $this->storedFiles());
        $this->assertNotSame($second['id'], $third['id']);

        // Back to inheritance: no file left for the target.
        $this->saveConfig('global', '', ['background' => ['image' => $other]]);
        $this->saveConfig('global', '', null);
        $this->assertSame([], $this->storedFiles());
    }
}
