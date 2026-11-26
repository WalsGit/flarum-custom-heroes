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

use Illuminate\Database\ConnectionInterface;
use Walsgit\CustomHeroes\HeroConfig;
use Walsgit\CustomHeroes\Image\HeroImages;

/**
 * Finds and removes the configs of tags or pages that no longer exist: deleted
 * while the extension was disabled, or all of them when their extension was
 * uninstalled (its ids start again from 1 if it is installed back).
 *
 * The config of a scope level (all tags, all pages) belongs to no item: it is
 * never one.
 */
final class OrphanConfigs
{
    /** The scopes with a config per item, by the extension that owns the items. */
    public const SCOPES = [
        'flarum-tags' => Scope::Tag,
        'fof-pages' => Scope::Pages,
        'tryhackx-advanced-pages' => Scope::AdvancedPages,
    ];

    private const TABLES = [
        'tag' => 'tags',
        'pages' => 'pages',
        'advancedPages' => 'advanced_pages',
    ];

    public function __construct(
        private readonly ConnectionInterface $db,
        private readonly ConfigRepository $configs,
    ) {
    }

    /**
     * @return list<string> the ids of the orphan configs of the scope
     */
    public function ids(Scope $scope): array
    {
        /** @var list<string> $ids */
        $ids = HeroConfig::query()->where('scope', $scope->value)->where('scope_id', '!=', '')->pluck('scope_id')->all();
        $table = self::TABLES[$scope->value];

        if ($ids === [] || ! $this->db->getSchemaBuilder()->hasTable($table)) {
            return $ids;
        }

        $existing = $this->db->table($table)->whereIn('id', $ids)->pluck('id')->map(fn ($id) => (string) $id)->all();

        return array_values(array_diff($ids, $existing));
    }

    /**
     * Removes the given orphan configs of the scope and their images.
     *
     * @param list<string> $ids
     */
    public function prune(Scope $scope, array $ids, HeroImages $images): void
    {
        foreach ($ids as $id) {
            $this->configs->delete($scope, $id);
            $images->cleanup($scope, $id, []);
        }
    }
}
