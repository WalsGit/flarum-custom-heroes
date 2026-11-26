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

use Flarum\Extension\Event\Uninstalled;
use Flarum\Extension\ExtensionManager;
use Flarum\Testing\integration\TestCase;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Contracts\Filesystem\Factory;
use PHPUnit\Framework\Attributes\Test;
use Walsgit\CustomHeroes\Config\OrphanConfigs;
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Extend\PruneOrphanConfigs;
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

    /**
     * Configs of tags 12 (exists), 99 (deleted) and the tag type, with a file for 12 and 99.
     *
     * @return array{string, string} the files of tags 12 and 99
     */
    private function orphanSetup(): array
    {
        $this->saveConfig('tag', '', ['height' => ['preset' => 's']]);
        $this->saveConfig('tag', '12', ['height' => ['preset' => 'l']]);
        $this->saveConfig('tag', '99', ['height' => ['preset' => 'm']]);

        $assets = $this->app()->getContainer()->make(Factory::class)->disk('flarum-assets');
        $files = [ImagePaths::background(Scope::Tag, '12', 'bbbbbbbbbbbbbbbb', 640), ImagePaths::background(Scope::Tag, '99', 'bbbbbbbbbbbbbbbb', 640)];

        foreach ($files as $file) {
            $assets->put($file, 'x');
        }

        return $files;
    }

    /**
     * @param array{string, string} $files
     */
    private function assertOnlyOrphanRemoved(array $files): void
    {
        $assets = $this->app()->getContainer()->make(Factory::class)->disk('flarum-assets');
        $configs = $this->configs();

        $this->assertArrayNotHasKey('tag:99', $configs);
        $this->assertArrayHasKey('tag:12', $configs);
        $this->assertArrayHasKey('tag', $configs);
        $this->assertTrue($assets->exists($files[0]));
        $this->assertFalse($assets->exists($files[1]));
        $assets->delete($files[0]);
    }

    #[Test]
    public function only_configs_of_missing_tags_are_orphans(): void
    {
        $files = $this->orphanSetup();

        $this->assertSame(['99'], $this->app()->getContainer()->make(OrphanConfigs::class)->ids(Scope::Tag));
        $this->app()->getContainer()->make(Factory::class)->disk('flarum-assets')->delete($files);
    }

    #[Test]
    public function enabling_the_extension_prunes_configs_of_missing_tags(): void
    {
        $files = $this->orphanSetup();
        $container = $this->app()->getContainer();

        (new PruneOrphanConfigs())->onEnable($container, $container->make(ExtensionManager::class)->getExtension('walsgit-custom-heroes'));

        $this->assertOnlyOrphanRemoved($files);
    }

    #[Test]
    public function uninstalling_tags_prunes_and_other_extensions_do_not(): void
    {
        $files = $this->orphanSetup();
        $container = $this->app()->getContainer();
        $extensions = $container->make(ExtensionManager::class);
        $events = $container->make(Dispatcher::class);

        $events->dispatch(new Uninstalled($extensions->getExtension('walsgit-custom-heroes')));
        $this->assertArrayHasKey('tag:99', $this->configs());

        $events->dispatch(new Uninstalled($extensions->getExtension('flarum-tags')));
        $this->assertOnlyOrphanRemoved($files);
    }
}
