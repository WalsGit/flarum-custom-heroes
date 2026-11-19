<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Config;

use Illuminate\Contracts\Cache\Repository as Cache;
use Walsgit\CustomHeroes\HeroConfig;

/**
 * Reads and writes the stored hero configs.
 *
 * All the configs are read at once and cached, so that rendering the forum
 * costs no query in the normal case. The cache is cleared on every write.
 */
final class ConfigRepository
{
    private const CACHE_KEY = 'walsgit-custom-heroes.configs';

    public function __construct(
        private readonly Cache $cache,
    ) {
    }

    /**
     * The stored configs, keyed by `scope` or `scope:scopeId`.
     *
     * @return array<string, array<string, mixed>>
     */
    public function all(): array
    {
        return $this->cache->rememberForever(self::CACHE_KEY, function () {
            $configs = [];

            foreach (HeroConfig::query()->orderBy('id')->get() as $row) {
                $configs[self::key($row->scope, $row->scope_id)] = $row->config;
            }

            return $configs;
        });
    }

    /**
     * Stores an already validated config. An empty config means "inherit
     * everything", so its row is deleted.
     *
     * @param array<string, mixed> $config
     */
    public function save(Scope $scope, string $scopeId, array $config): void
    {
        $query = HeroConfig::query()->where('scope', $scope->value)->where('scope_id', $scopeId);

        if ($config === []) {
            $query->delete();
        } else {
            $row = $query->first() ?? new HeroConfig();
            $row->scope = $scope->value;
            $row->scope_id = $scopeId;
            $row->config = $config;
            $row->save();
        }

        $this->cache->forget(self::CACHE_KEY);
    }

    public static function key(string $scope, string $scopeId): string
    {
        return $scopeId === '' ? $scope : "$scope:$scopeId";
    }
}
