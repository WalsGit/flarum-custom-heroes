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

use Flarum\Foundation\ValidationException;
use Symfony\Contracts\Translation\TranslatorInterface;

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
    case Tag = 'tag';
    case Discussion = 'discussion';
    // Heroes of flarum/messages and flarum/deck (optional extensions).
    case Messages = 'messages';
    case Deck = 'deck';
    // Heroes of the other extensions, customized only once the admin enables it.
    case Other = 'other';

    private const COMMON_SECTIONS = ['background', 'overlay', 'height', 'textStyle', 'logo', 'socials', 'buttons'];

    private const INSTANCE_SECTIONS = ['background', 'overlay', 'height'];

    /**
     * Reads the target (`scope`, `scopeId`) of an admin request body.
     *
     * @param array<mixed> $body
     * @return array{self, string}
     *
     * @throws ValidationException
     */
    public static function fromBody(array $body, TranslatorInterface $translator): array
    {
        $scope = is_string($body['scope'] ?? null) ? self::tryFrom($body['scope']) : null;
        $scopeId = $body['scopeId'] ?? '';

        if ($scope === null || ! is_string($scopeId) || ! $scope->acceptsScopeId($scopeId)) {
            $path = $scope === null ? 'scope' : 'scopeId';

            throw new ValidationException([
                $path => $translator->trans('walsgit-custom-heroes.api.validation.invalid_value', ['path' => $path]),
            ]);
        }

        return [$scope, $scopeId];
    }

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

        // The default level is also the home (Welcome) hero: its text is set there.
        if ($this === self::Global) {
            return [...self::COMMON_SECTIONS, 'text'];
        }

        // The tag icon and description are shown or hidden for every tag at once.
        if ($this === self::Tag) {
            return [...self::COMMON_SECTIONS, 'tagIcon', 'tagDescription'];
        }

        // The tags of a discussion (flarum/tags): their place and their color.
        if ($this === self::Discussion) {
            return [...self::COMMON_SECTIONS, 'discussionTags', 'tagColor', 'tagHero'];
        }

        if ($this === self::Other) {
            return [...self::COMMON_SECTIONS, 'enabled'];
        }

        return self::COMMON_SECTIONS;
    }
}
