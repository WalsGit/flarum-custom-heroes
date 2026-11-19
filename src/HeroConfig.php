<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes;

use Flarum\Database\AbstractModel;

/**
 * A validated hero config, for a scope or an instance of it.
 *
 * @property int $id
 * @property string $scope
 * @property string $scope_id
 * @property array<string, mixed> $config
 */
class HeroConfig extends AbstractModel
{
    public $timestamps = true;

    protected $table = 'walsgit_custom_heroes';

    protected $casts = [
        'config' => 'array',
    ];
}
