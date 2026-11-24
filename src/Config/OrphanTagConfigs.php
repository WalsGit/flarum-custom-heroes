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

/**
 * Finds the configs of tags that no longer exist: tags deleted while the
 * extension was disabled, or all of them when flarum/tags was uninstalled
 * (its ids start again from 1 if it is installed back).
 *
 * The config of the tag type (all tags) belongs to no tag: it is never one.
 */
final class OrphanTagConfigs
{
    public function __construct(
        private readonly ConnectionInterface $db,
    ) {
    }

    /**
     * @return list<string> the ids of the orphan tag configs
     */
    public function ids(): array
    {
        /** @var list<string> $ids */
        $ids = HeroConfig::query()->where('scope', Scope::Tag->value)->where('scope_id', '!=', '')->pluck('scope_id')->all();

        if ($ids === [] || ! $this->db->getSchemaBuilder()->hasTable('tags')) {
            return $ids;
        }

        $existing = $this->db->table('tags')->whereIn('id', $ids)->pluck('id')->map(fn ($id) => (string) $id)->all();

        return array_values(array_diff($ids, $existing));
    }
}
