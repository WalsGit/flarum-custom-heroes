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
use Illuminate\Contracts\Filesystem\Filesystem;
use LogicException;
use Symfony\Contracts\Translation\TranslatorInterface;
use Walsgit\CustomHeroes\Image\ImagePaths;

/**
 * Validates and normalizes a hero config before it is stored.
 *
 * The config is a whitelist: unknown sections and keys are rejected, every
 * value is checked against a strict type, bound or pattern, and optional keys
 * are filled with their default value. The reference for the schema is
 * `.docs/config-schema.md`.
 */
final class ConfigValidator
{
    private const POSITIONS = ['center', 'top', 'bottom'];
    private const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    private const PLACEMENTS = [...self::CORNERS, 'below-text'];
    private const HEIGHT_PRESETS = ['auto', 's', 'm', 'l', 'custom'];
    private const SIZES = ['s', 'm', 'l'];
    private const BUTTON_ACTIONS = ['link', 'login', 'signup'];
    private const VISIBILITIES = ['all', 'guest', 'user'];

    private const COLOR_PATTERN = '/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i';
    private const ICON_PATTERN = '/^(?:fa[srb]|fa-(?:solid|regular|brands)) fa-[a-z0-9-]+$/';
    private const TEL_PATTERN = '/^\+?[0-9 ().-]{3,30}$/';

    private const URL_MAX_LENGTH = 255;
    private const ICON_MAX_LENGTH = 60;
    private const IMAGE_MAX_SIZE = 4000;

    /**
     * Error messages keyed by the path of the invalid value.
     *
     * @var array<string, string>
     */
    private array $errors = [];

    /**
     * The target being validated: images must belong to it.
     */
    private Scope $scope;
    private string $scopeId = '';

    public function __construct(
        private readonly Filesystem $assets,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @return array<string, mixed> the normalized config
     *
     * @throws ValidationException
     */
    public function validate(Scope $scope, string $scopeId, mixed $config): array
    {
        $this->errors = [];
        $this->scope = $scope;
        $this->scopeId = $scopeId;
        $result = [];

        if (! $scope->acceptsScopeId($scopeId)) {
            $this->fail('scopeId', 'invalid_value');
        } elseif (! $this->isObject($config)) {
            $this->fail('config', 'invalid_value');
        } else {
            $allowed = $scope->allowedSections($scopeId);

            foreach ($config as $section => $value) {
                $path = "config.$section";

                if (! is_string($section) || ! in_array($section, $allowed, true)) {
                    $this->fail($path, 'section_not_allowed');
                    continue;
                }

                $result[$section] = match ($section) {
                    'background' => $this->background($value, $path),
                    'overlay' => $this->overlay($value, $path),
                    'height' => $this->height($value, $path),
                    'textStyle' => $this->textStyle($value, $path),
                    'text' => $this->text($value, $path),
                    'logo' => $this->logo($value, $path),
                    'socials' => $this->socials($value, $path),
                    'buttons' => $this->buttons($value, $path),
                    // Every allowed section must have its own validation.
                    default => throw new LogicException("No validation for the section $section."),
                };
            }

            $this->checkPlacementConflict($result);
        }

        if ($this->errors !== []) {
            throw new ValidationException($this->errors);
        }

        return $result;
    }

    // Sections ---------------------------------------------------------------

    /**
     * @return array<string, mixed>|null
     */
    private function background(mixed $value, string $path): ?array
    {
        $object = $this->object($value, $path, ['image'], ['position']);

        if ($object === null) {
            return null;
        }

        return [
            'image' => $object['image'] === null ? null : $this->imageRef($object['image'], "$path.image", true),
            'position' => $this->enum($object['position'] ?? 'center', self::POSITIONS, "$path.position"),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function overlay(mixed $value, string $path): ?array
    {
        $type = $this->isObject($value) ? ($value['type'] ?? null) : null;

        switch ($type) {
            case 'none':
                return $this->object($value, $path, ['type']) === null ? null : ['type' => 'none'];

            case 'solid':
                $object = $this->object($value, $path, ['type', 'color']);

                return $object === null ? null : [
                    'type' => 'solid',
                    'color' => $this->color($object['color'], "$path.color"),
                ];

            case 'gradient':
                // Linear: along an angle, or from a corner to the opposite one.
                $object = $this->object($value, $path, ['type', 'stops'], ['angle', 'corner']);

                if ($object === null) {
                    return null;
                }

                if (array_key_exists('angle', $object) === array_key_exists('corner', $object)) {
                    $this->fail("$path.angle", 'invalid_value');

                    return null;
                }

                $direction = array_key_exists('corner', $object)
                    ? ['corner' => $this->enum($object['corner'], self::CORNERS, "$path.corner")]
                    : ['angle' => $this->int($object['angle'], 0, 360, "$path.angle")];

                return ['type' => 'gradient', ...$direction, 'stops' => $this->gradientStops($object['stops'], "$path.stops")];

            case 'corners':
                // One color per corner, blending in the middle.
                $object = $this->object($value, $path, ['type', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']);

                return $object === null ? null : [
                    'type' => 'corners',
                    'topLeft' => $this->color($object['topLeft'], "$path.topLeft"),
                    'topRight' => $this->color($object['topRight'], "$path.topRight"),
                    'bottomLeft' => $this->color($object['bottomLeft'], "$path.bottomLeft"),
                    'bottomRight' => $this->color($object['bottomRight'], "$path.bottomRight"),
                ];

            case 'radial':
                $object = $this->object($value, $path, ['type', 'stops'], ['shape', 'position']);

                return $object === null ? null : [
                    'type' => 'radial',
                    'shape' => $this->enum($object['shape'] ?? 'ellipse', ['circle', 'ellipse'], "$path.shape"),
                    'position' => $this->enum($object['position'] ?? 'center', ['center', ...self::CORNERS], "$path.position"),
                    'stops' => $this->gradientStops($object['stops'], "$path.stops"),
                ];

            default:
                $this->fail($this->isObject($value) ? "$path.type" : $path, 'invalid_value');

                return null;
        }
    }

    /**
     * @return list<array<string, mixed>>|null
     */
    private function gradientStops(mixed $value, string $path): ?array
    {
        $items = $this->list($value, $path, 2, 4);

        if ($items === null) {
            return null;
        }

        $stops = [];
        $previous = -1;

        foreach ($items as $index => $item) {
            $object = $this->object($item, "$path.$index", ['color', 'at']);

            if ($object === null) {
                continue;
            }

            $at = $this->int($object['at'], 0, 100, "$path.$index.at");

            if ($at !== null && $at < $previous) {
                $this->fail("$path.$index.at", 'stops_order');
            }

            $previous = $at ?? $previous;
            $stops[] = ['color' => $this->color($object['color'], "$path.$index.color"), 'at' => $at];
        }

        return $stops;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function height(mixed $value, string $path): ?array
    {
        $preset = $this->isObject($value) ? ($value['preset'] ?? null) : null;

        if ($preset === 'custom') {
            $object = $this->object($value, $path, ['preset', 'desktop', 'tablet', 'mobile']);

            return $object === null ? null : [
                'preset' => 'custom',
                'desktop' => $this->int($object['desktop'], 80, 800, "$path.desktop"),
                'tablet' => $this->int($object['tablet'], 80, 800, "$path.tablet"),
                'mobile' => $this->int($object['mobile'], 80, 600, "$path.mobile"),
            ];
        }

        if (is_string($preset) && in_array($preset, self::HEIGHT_PRESETS, true)) {
            return $this->object($value, $path, ['preset']) === null ? null : ['preset' => $preset];
        }

        $this->fail($this->isObject($value) ? "$path.preset" : $path, 'invalid_value');

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function textStyle(mixed $value, string $path): ?array
    {
        $object = $this->object($value, $path, [], ['align', 'vAlign', 'titleSize', 'subtitleSize', 'color']);

        if ($object === null) {
            return null;
        }

        return [
            'align' => $this->enum($object['align'] ?? 'center', ['left', 'center', 'right'], "$path.align"),
            'vAlign' => $this->enum($object['vAlign'] ?? 'middle', ['top', 'middle', 'bottom'], "$path.vAlign"),
            'titleSize' => $this->enum($object['titleSize'] ?? 'm', ['s', 'm', 'l', 'xl'], "$path.titleSize"),
            'subtitleSize' => $this->enum($object['subtitleSize'] ?? 'm', self::SIZES, "$path.subtitleSize"),
            'color' => $this->nullableColor($object['color'] ?? null, "$path.color"),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function text(mixed $value, string $path): ?array
    {
        $object = $this->object($value, $path, [], ['afterClose', 'title', 'message']);

        if ($object === null) {
            return null;
        }

        return [
            'afterClose' => $this->enum($object['afterClose'] ?? 'hero', ['hero', 'none'], "$path.afterClose"),
            'title' => $this->string($object['title'] ?? '', "$path.title", 0, 100, false),
            'message' => $this->string($object['message'] ?? '', "$path.message", 0, 500, true),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function logo(mixed $value, string $path): ?array
    {
        $object = $this->object($value, $path, ['image'], ['side', 'size', 'alt', 'hideOnMobile']);

        if ($object === null) {
            return null;
        }

        return [
            // null: no logo, instead of the one of the level above.
            'image' => $object['image'] === null ? null : $this->imageRef($object['image'], "$path.image", false),
            'side' => $this->enum($object['side'] ?? 'left', ['left', 'right'], "$path.side"),
            'size' => $this->enum($object['size'] ?? 'm', self::SIZES, "$path.size"),
            'alt' => $this->string($object['alt'] ?? '', "$path.alt", 0, 100, false),
            'hideOnMobile' => $this->bool($object['hideOnMobile'] ?? false, "$path.hideOnMobile"),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function socials(mixed $value, string $path): ?array
    {
        $object = $this->object($value, $path, ['items'], ['size', 'placement', 'color', 'mobile']);

        if ($object === null) {
            return null;
        }

        $items = [];

        foreach ($this->list($object['items'], "$path.items", 0, 10) ?? [] as $index => $item) {
            $itemPath = "$path.items.$index";
            $entry = $this->object($item, $itemPath, ['icon', 'url', 'label']);

            if ($entry !== null) {
                $items[] = [
                    'icon' => $this->icon($entry['icon'], "$itemPath.icon"),
                    'url' => $this->url($entry['url'], "$itemPath.url", true),
                    'label' => $this->string($entry['label'], "$itemPath.label", 1, 50, false),
                ];
            }
        }

        return [
            'size' => $this->enum($object['size'] ?? 's', ['xs', 's', 'm'], "$path.size"),
            'placement' => $this->enum($object['placement'] ?? 'below-text', self::PLACEMENTS, "$path.placement"),
            'color' => $this->nullableColor($object['color'] ?? null, "$path.color"),
            // On mobile: like on wider screens, below the text instead of a corner, or hidden.
            'mobile' => $this->enum($object['mobile'] ?? 'same', ['same', 'below-text', 'hide'], "$path.mobile"),
            'items' => $items,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buttons(mixed $value, string $path): ?array
    {
        $object = $this->object($value, $path, ['items'], ['placement']);

        if ($object === null) {
            return null;
        }

        $items = [];

        foreach ($this->list($object['items'], "$path.items", 0, 4) ?? [] as $index => $item) {
            $button = $this->button($item, "$path.items.$index");

            if ($button !== null) {
                $items[] = $button;
            }
        }

        return [
            'placement' => $this->enum($object['placement'] ?? 'below-text', self::PLACEMENTS, "$path.placement"),
            'items' => $items,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function button(mixed $value, string $path): ?array
    {
        $action = $this->isObject($value) ? ($value['action'] ?? null) : null;

        if (! is_string($action) || ! in_array($action, self::BUTTON_ACTIONS, true)) {
            $this->fail($this->isObject($value) ? "$path.action" : $path, 'invalid_value');

            return null;
        }

        $common = ['icon', 'size', 'bg', 'color'];

        // Log in and sign up buttons are always for guests only: they have no
        // URL, target or visibility of their own.
        $object = $action === 'link'
            ? $this->object($value, $path, ['label', 'action', 'url'], [...$common, 'newTab', 'visibility'])
            : $this->object($value, $path, ['label', 'action'], $common);

        if ($object === null) {
            return null;
        }

        $button = [
            'label' => $this->string($object['label'], "$path.label", 1, 40, false),
            'icon' => ($object['icon'] ?? null) === null ? null : $this->icon($object['icon'], "$path.icon"),
            'action' => $action,
        ];

        if ($action === 'link') {
            $button['url'] = $this->url($object['url'], "$path.url", false);
            $button['newTab'] = $this->bool($object['newTab'] ?? false, "$path.newTab");
            $button['visibility'] = $this->enum($object['visibility'] ?? 'all', self::VISIBILITIES, "$path.visibility");
        }

        return $button + [
            'size' => $this->enum($object['size'] ?? 'm', self::SIZES, "$path.size"),
            'bg' => $this->nullableColor($object['bg'] ?? null, "$path.bg"),
            'color' => $this->nullableColor($object['color'] ?? null, "$path.color"),
        ];
    }

    /**
     * Buttons and social icons cannot share a corner. Below the text is the
     * only placement they can share: they are stacked there.
     *
     * @param array<string, mixed> $config
     */
    private function checkPlacementConflict(array $config): void
    {
        $buttons = $config['buttons'] ?? null;
        $socials = $config['socials'] ?? null;

        if (! is_array($buttons) || ! is_array($socials)) {
            return;
        }

        $placement = $buttons['placement'] ?? null;

        if (in_array($placement, self::CORNERS, true) && $placement === ($socials['placement'] ?? null)) {
            $this->fail('config.buttons.placement', 'placement_conflict');
        }
    }

    // Values -----------------------------------------------------------------

    /**
     * @return array<string, mixed>|null
     */
    private function imageRef(mixed $value, string $path, bool $background): ?array
    {
        $required = $background ? ['id', 'width', 'height', 'widths'] : ['id', 'width', 'height'];
        $object = $this->object($value, $path, $required);

        if ($object === null) {
            return null;
        }

        $id = $object['id'];

        if (! is_string($id) || preg_match(ImagePaths::ID_PATTERN, $id) !== 1) {
            $this->fail("$path.id", 'invalid_value');

            return null;
        }

        $ref = [
            'id' => $id,
            'width' => $this->int($object['width'], 1, self::IMAGE_MAX_SIZE, "$path.width"),
            'height' => $this->int($object['height'], 1, self::IMAGE_MAX_SIZE, "$path.height"),
        ];

        if ($background) {
            $widths = $object['widths'];
            // Must be a non-empty, ascending subset of the generated widths.
            $expected = is_array($widths) ? array_values(array_intersect(ImagePaths::BACKGROUND_WIDTHS, $widths)) : [];

            if ($expected === [] || $widths !== $expected) {
                $this->fail("$path.widths", 'invalid_value');

                return null;
            }

            $ref['widths'] = $expected;
            $files = array_map(fn (int $width) => ImagePaths::background($this->scope, $this->scopeId, $id, $width), $expected);
        } else {
            $files = [ImagePaths::logo($this->scope, $this->scopeId, $id)];
        }

        // The paths are built from the target, so an image uploaded for another
        // hero (which may clean it up) is not found.

        foreach ($files as $file) {
            if (! $this->assets->exists($file)) {
                $this->fail($path, 'image_not_found');

                return null;
            }
        }

        return $ref;
    }

    private function url(mixed $value, string $path, bool $allowContactSchemes): ?string
    {
        if (is_string($value) && strlen($value) > self::URL_MAX_LENGTH) {
            $this->fail($path, 'too_long', ['max' => self::URL_MAX_LENGTH]);

            return null;
        }

        $url = null;

        if (is_string($value) && mb_check_encoding($value, 'UTF-8') && preg_match('/[\x00-\x1F\x7F]/', $value) !== 1) {
            $url = $allowContactSchemes ? ($this->contactUrl($value) ?? $this->webUrl($value)) : $this->webUrl($value);
        }

        if ($url === null) {
            $this->fail($path, 'invalid_value');
        }

        return $url;
    }

    /**
     * Returns the `http(s)` URL, or null if it is not a valid absolute one.
     */
    private function webUrl(string $value): ?string
    {
        $valid = preg_match('/\s/u', $value) !== 1
            && filter_var($value, FILTER_VALIDATE_URL) !== false
            && in_array(strtolower((string) parse_url($value, PHP_URL_SCHEME)), ['http', 'https'], true)
            && (string) parse_url($value, PHP_URL_HOST) !== '';

        return $valid ? $value : null;
    }

    /**
     * Returns the `mailto:` or `tel:` URL, or null if it is not a valid one.
     * Only phone numbers may contain spaces.
     */
    private function contactUrl(string $value): ?string
    {
        $scheme = strtolower(strstr($value, ':', true) ?: '');
        $target = substr($value, strlen($scheme) + 1);

        $valid = match ($scheme) {
            'mailto' => filter_var($target, FILTER_VALIDATE_EMAIL) !== false,
            'tel' => preg_match(self::TEL_PATTERN, $target) === 1 && preg_match_all('/[0-9]/', $target) >= 3,
            default => false,
        };

        return $valid ? "$scheme:$target" : null;
    }

    private function string(mixed $value, string $path, int $min, int $max, bool $multiline): ?string
    {
        if (! is_string($value) || ! mb_check_encoding($value, 'UTF-8')) {
            $this->fail($path, 'invalid_value');

            return null;
        }

        $value = trim(str_replace(["\r\n", "\r"], "\n", $value));
        $forbidden = $multiline ? '/[\x00-\x09\x0B-\x1F\x7F]/' : '/[\x00-\x1F\x7F]/';

        if (preg_match($forbidden, $value) === 1) {
            $this->fail($path, 'invalid_value');

            return null;
        }

        $length = mb_strlen($value);

        if ($length < $min) {
            $this->fail($path, 'missing_key');

            return null;
        }

        if ($length > $max) {
            $this->fail($path, 'too_long', ['max' => $max]);

            return null;
        }

        return $value;
    }

    private function icon(mixed $value, string $path): ?string
    {
        if (is_string($value) && strlen($value) <= self::ICON_MAX_LENGTH && preg_match(self::ICON_PATTERN, $value) === 1) {
            return $value;
        }

        $this->fail($path, 'invalid_value');

        return null;
    }

    private function color(mixed $value, string $path): ?string
    {
        if (is_string($value) && preg_match(self::COLOR_PATTERN, $value) === 1) {
            return strtolower($value);
        }

        $this->fail($path, 'invalid_value');

        return null;
    }

    private function nullableColor(mixed $value, string $path): ?string
    {
        return $value === null ? null : $this->color($value, $path);
    }

    /**
     * @param list<string> $allowed
     */
    private function enum(mixed $value, array $allowed, string $path): ?string
    {
        if (is_string($value) && in_array($value, $allowed, true)) {
            return $value;
        }

        $this->fail($path, 'invalid_value');

        return null;
    }

    private function int(mixed $value, int $min, int $max, string $path): ?int
    {
        if (is_int($value) && $value >= $min && $value <= $max) {
            return $value;
        }

        $this->fail($path, 'invalid_value');

        return null;
    }

    private function bool(mixed $value, string $path): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $this->fail($path, 'invalid_value');

        return null;
    }

    // Structure --------------------------------------------------------------

    /**
     * Checks that the value is an object with all the required keys and no
     * other key than the required and optional ones.
     *
     * @param list<string> $required
     * @param list<string> $optional
     * @return array<mixed>|null
     */
    private function object(mixed $value, string $path, array $required, array $optional = []): ?array
    {
        if (! $this->isObject($value)) {
            $this->fail($path, 'invalid_value');

            return null;
        }

        $valid = true;
        $known = [...$required, ...$optional];

        foreach (array_keys($value) as $key) {
            if (! in_array($key, $known, true)) {
                $this->fail("$path.$key", 'unknown_key');
                $valid = false;
            }
        }

        foreach ($required as $key) {
            if (! array_key_exists($key, $value)) {
                $this->fail("$path.$key", 'missing_key');
                $valid = false;
            }
        }

        return $valid ? $value : null;
    }

    /**
     * @return list<mixed>|null
     */
    private function list(mixed $value, string $path, int $min, int $max): ?array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            $this->fail($path, 'invalid_value');

            return null;
        }

        if (count($value) < $min) {
            $this->fail($path, 'not_enough_items', ['min' => $min]);

            return null;
        }

        if (count($value) > $max) {
            $this->fail($path, 'too_many_items', ['max' => $max]);

            return null;
        }

        return $value;
    }

    /**
     * A JSON object is decoded as an associative array (an empty object as an
     * empty array). A JSON list is not an object.
     *
     * @phpstan-assert-if-true array<mixed> $value
     */
    private function isObject(mixed $value): bool
    {
        return is_array($value) && ($value === [] || ! array_is_list($value));
    }

    /**
     * Records the first error found for a path.
     *
     * @param array<string, int|string> $parameters
     */
    private function fail(string $path, string $error, array $parameters = []): void
    {
        $this->errors[$path] ??= $this->translator->trans(
            "walsgit-custom-heroes.api.validation.$error",
            ['path' => $path, ...$parameters]
        );
    }
}
