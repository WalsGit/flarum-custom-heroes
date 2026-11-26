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

/**
 * Configs of fof/pages and tryhackx/flarum-advanced-pages pages that no longer exist.
 */
class OrphanPageConfigsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('fof-pages', 'tryhackx-advanced-pages', 'walsgit-custom-heroes');

        $this->prepareDatabase([
            'pages' => [
                ['id' => 5, 'title' => 'About', 'slug' => 'about', 'content' => 'x', 'created_at' => '2026-01-01 00:00:00'],
            ],
            'advanced_pages' => [
                ['id' => 7, 'title' => 'Rules', 'slug' => 'rules', 'content' => 'x'],
            ],
        ]);
    }

    private function saveConfig(string $scope, string $scopeId): void
    {
        $response = $this->send($this->request('POST', '/api/walsgit-custom-heroes/configs', [
            'authenticatedAs' => 1,
            'json' => ['scope' => $scope, 'scopeId' => $scopeId, 'config' => ['height' => ['preset' => 's']]],
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

    /**
     * Configs of both levels, of existing pages (5, 7) and of deleted ones (99), with a file for each page.
     *
     * @return array<string, string> the files, by config key
     */
    private function orphanSetup(): array
    {
        $assets = $this->app()->getContainer()->make(Factory::class)->disk('flarum-assets');
        $files = [];

        foreach ([[Scope::Pages, '5'], [Scope::Pages, '99'], [Scope::AdvancedPages, '7'], [Scope::AdvancedPages, '99']] as [$scope, $id]) {
            $this->saveConfig($scope->value, '');
            $this->saveConfig($scope->value, $id);
            $files["$scope->value:$id"] = ImagePaths::background($scope, $id, 'cccccccccccccccc', 640);
            $assets->put($files["$scope->value:$id"], 'x');
        }

        return $files;
    }

    /**
     * @param array<string, string> $files
     * @param list<string> $removed the config keys expected to be gone
     */
    private function assertRemoved(array $files, array $removed): void
    {
        $assets = $this->app()->getContainer()->make(Factory::class)->disk('flarum-assets');
        $configs = $this->configs();

        $this->assertArrayHasKey('pages', $configs);
        $this->assertArrayHasKey('advancedPages', $configs);

        foreach ($files as $key => $file) {
            $this->assertSame(! in_array($key, $removed, true), array_key_exists($key, $configs), $key);
            $this->assertSame(! in_array($key, $removed, true), $assets->exists($file), $file);
        }

        $assets->delete(array_values($files));
    }

    #[Test]
    public function only_configs_of_missing_pages_are_orphans(): void
    {
        $files = $this->orphanSetup();
        $orphans = $this->app()->getContainer()->make(OrphanConfigs::class);

        $this->assertSame(['99'], $orphans->ids(Scope::Pages));
        $this->assertSame(['99'], $orphans->ids(Scope::AdvancedPages));
        $this->app()->getContainer()->make(Factory::class)->disk('flarum-assets')->delete(array_values($files));
    }

    #[Test]
    public function enabling_the_extension_prunes_configs_of_missing_pages(): void
    {
        $files = $this->orphanSetup();
        $container = $this->app()->getContainer();

        (new PruneOrphanConfigs())->onEnable($container, $container->make(ExtensionManager::class)->getExtension('walsgit-custom-heroes'));

        $this->assertRemoved($files, ['pages:99', 'advancedPages:99']);
    }

    #[Test]
    public function uninstalling_a_page_extension_prunes_only_its_configs(): void
    {
        $files = $this->orphanSetup();
        $container = $this->app()->getContainer();

        $container->make(Dispatcher::class)->dispatch(new Uninstalled($container->make(ExtensionManager::class)->getExtension('fof-pages')));

        $this->assertRemoved($files, ['pages:99']);
    }
}
