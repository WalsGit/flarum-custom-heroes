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

use Flarum\Testing\integration\TestCase;
use Illuminate\Contracts\Filesystem\Factory;
use PHPUnit\Framework\Attributes\Test;
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Image\ImagePaths;

class DeleteTagTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('flarum-tags', 'walsgit-custom-heroes');

        $this->prepareDatabase([
            'tags' => [
                ['id' => 12, 'name' => 'News', 'slug' => 'news', 'position' => 0],
                ['id' => 13, 'name' => 'Help', 'slug' => 'help', 'position' => 1],
            ],
        ]);
    }

    /**
     * @param array<string, mixed> $config
     */
    private function saveConfig(string $scope, string $scopeId, array $config): void
    {
        $response = $this->send($this->request('POST', '/api/walsgit-custom-heroes/configs', [
            'authenticatedAs' => 1,
            'json' => ['scope' => $scope, 'scopeId' => $scopeId, 'config' => $config],
        ]));

        $this->assertSame(200, $response->getStatusCode());
    }

    /**
     * @return array<string, mixed>
     */
    private function configs(): array
    {
        $response = $this->send($this->request('GET', '/api'));

        return json_decode((string) $response->getBody(), true)['data']['attributes']['walsgitCustomHeroes']['configs'];
    }

    #[Test]
    public function deleting_a_tag_removes_its_hero_config_only(): void
    {
        $this->saveConfig('tag', '', ['height' => ['preset' => 's']]);
        $this->saveConfig('tag', '12', ['height' => ['preset' => 'l']]);
        $this->saveConfig('tag', '13', ['height' => ['preset' => 'm']]);

        $response = $this->send($this->request('DELETE', '/api/tags/12', ['authenticatedAs' => 1]));
        $this->assertSame(204, $response->getStatusCode());

        $configs = $this->configs();
        $this->assertArrayNotHasKey('tag:12', $configs);
        $this->assertArrayHasKey('tag:13', $configs);
        $this->assertArrayHasKey('tag', $configs);
    }

    #[Test]
    public function deleting_a_tag_removes_its_images_only(): void
    {
        $assets = $this->app()->getContainer()->make(Factory::class)->disk('flarum-assets');
        $id = 'aaaaaaaaaaaaaaaa';
        $tag12 = ImagePaths::background(Scope::Tag, '12', $id, 640);
        $tag13 = ImagePaths::background(Scope::Tag, '13', $id, 640);
        $assets->put($tag12, 'x');
        $assets->put($tag13, 'x');

        $this->send($this->request('DELETE', '/api/tags/12', ['authenticatedAs' => 1]));

        $this->assertFalse($assets->exists($tag12));
        $this->assertTrue($assets->exists($tag13));
        $assets->delete($tag13);
    }
}
