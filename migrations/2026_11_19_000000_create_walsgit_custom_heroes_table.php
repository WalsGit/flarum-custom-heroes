<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

return Migration::createTable('walsgit_custom_heroes', function (Blueprint $table) {
    $table->increments('id');
    $table->string('scope', 32);
    // An empty string rather than NULL for the scope level itself, so that the
    // unique index behaves the same on MySQL, MariaDB, PostgreSQL and SQLite.
    $table->string('scope_id', 64)->default('');
    $table->json('config');
    $table->timestamps();

    $table->unique(['scope', 'scope_id']);
});
