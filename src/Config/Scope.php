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

/**
 * The places a hero config can be defined for.
 *
 * A config row is identified by a scope and a scope id: an empty scope id is
 * the scope level itself (for example "all tag heroes"), a non-empty one is an
 * instance of it (for example "the hero of tag 12").
 */
enum Scope: string
{
    case Global = 'global';
    case Welcome = 'welcome';
    case Tag = 'tag';
    case Discussion = 'discussion';

    private const COMMON_SECTIONS = ['background', 'overlay', 'height', 'textStyle', 'logo', 'socials', 'buttons'];

    private const INSTANCE_SECTIONS = ['background', 'overlay', 'height'];

    public function acceptsScopeId(string $scopeId): bool
    {
        if ($scopeId === '') {
            return true;
        }

        // Only tags have instances for now, identified by their numeric id.
        return $this === self::Tag && preg_match('/^[1-9][0-9]{0,9}$/', $scopeId) === 1;
    }

    /**
     * @return list<string>
     */
    public function allowedSections(string $scopeId): array
    {
        if ($scopeId !== '') {
            return self::INSTANCE_SECTIONS;
        }

        if ($this === self::Welcome) {
            return [...self::COMMON_SECTIONS, 'text', 'dismissible'];
        }

        return self::COMMON_SECTIONS;
    }
}
