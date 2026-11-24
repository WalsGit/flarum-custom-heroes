<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Tests\unit\Config;

use Flarum\Foundation\ValidationException;
use Flarum\Testing\unit\TestCase;
use Illuminate\Contracts\Filesystem\Filesystem;
use Mockery as m;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Contracts\Translation\TranslatorInterface;
use Walsgit\CustomHeroes\Config\ConfigValidator;
use Walsgit\CustomHeroes\Config\Scope;
use Walsgit\CustomHeroes\Image\ImagePaths;

class ConfigValidatorTest extends TestCase
{
    private const BG_ID = 'aaaaaaaaaaaaaaaa';
    private const LOGO_ID = 'bbbbbbbbbbbbbbbb';
    private const OTHER_ID = 'dddddddddddddddd';

    private ConfigValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();

        $existing = [
            ImagePaths::background(Scope::Global, '', self::BG_ID, 640),
            ImagePaths::background(Scope::Global, '', self::BG_ID, 1024),
            ImagePaths::logo(Scope::Global, '', self::LOGO_ID),
            // Uploaded for another hero.
            ImagePaths::background(Scope::Discussion, '', self::OTHER_ID, 640),
            ImagePaths::background(Scope::Tag, '12', self::OTHER_ID, 640),
        ];

        $assets = m::mock(Filesystem::class);
        $assets->shouldReceive('exists')->andReturnUsing(fn (string $path) => in_array($path, $existing, true));

        // Returns the translation key, so that tests can assert the error type.
        $translator = m::mock(TranslatorInterface::class);
        $translator->shouldReceive('trans')->andReturnUsing(fn (string $key) => $key);

        $this->validator = new ConfigValidator($assets, $translator);
    }

    // Helpers ----------------------------------------------------------------

    /**
     * @param array<mixed> $config
     * @return array<string, mixed>
     */
    private function valid(array $config, Scope $scope = Scope::Global, string $scopeId = ''): array
    {
        return $this->validator->validate($scope, $scopeId, $config);
    }

    private function assertInvalid(mixed $config, string $path, string $error, Scope $scope = Scope::Global, string $scopeId = ''): void
    {
        try {
            $this->validator->validate($scope, $scopeId, $config);
        } catch (ValidationException $e) {
            $errors = $e->getAttributes();
            $this->assertArrayHasKey($path, $errors, 'Errors: '.json_encode($errors));
            $this->assertSame("walsgit-custom-heroes.api.validation.$error", $errors[$path]);

            return;
        }

        $this->fail("Expected a validation error at $path.");
    }

    /**
     * @return array<string, mixed>
     */
    private static function backgroundImage(): array
    {
        return ['id' => self::BG_ID, 'width' => 1200, 'height' => 400, 'widths' => [640, 1024]];
    }

    /**
     * @return array<string, mixed>
     */
    private static function logoImage(): array
    {
        return ['id' => self::LOGO_ID, 'width' => 240, 'height' => 120];
    }

    // Structure and scopes ---------------------------------------------------

    public function test_empty_config_is_valid_for_every_scope(): void
    {
        foreach (Scope::cases() as $scope) {
            $this->assertSame([], $this->valid([], $scope));
        }

        $this->assertSame([], $this->valid([], Scope::Tag, '12'));
    }

    public function test_config_must_be_an_object(): void
    {
        $this->assertInvalid('nope', 'config', 'invalid_value');
        $this->assertInvalid([['background' => []]], 'config', 'invalid_value');
    }

    #[DataProvider('invalidScopeIds')]
    public function test_scope_id_is_checked(Scope $scope, string $scopeId): void
    {
        $this->assertInvalid([], 'scopeId', 'invalid_value', $scope, $scopeId);
    }

    /**
     * @return array<string, array{Scope, string}>
     */
    public static function invalidScopeIds(): array
    {
        return [
            'global with id' => [Scope::Global, '1'],
            'discussion with id' => [Scope::Discussion, '1'],
            'messages with id' => [Scope::Messages, '1'],
            'deck with id' => [Scope::Deck, '1'],
            'tag with text id' => [Scope::Tag, 'abc'],
            'tag with zero id' => [Scope::Tag, '0'],
            'tag with leading zero' => [Scope::Tag, '012'],
            'tag with injection' => [Scope::Tag, '1 OR 1=1'],
        ];
    }

    #[DataProvider('forbiddenSections')]
    public function test_sections_are_limited_by_scope(Scope $scope, string $scopeId, string $section): void
    {
        $this->assertInvalid([$section => []], "config.$section", 'section_not_allowed', $scope, $scopeId);
    }

    /**
     * @return array<string, array{Scope, string, string}>
     */
    public static function forbiddenSections(): array
    {
        return [
            'unknown section' => [Scope::Global, '', 'script'],
            'text on discussion' => [Scope::Discussion, '', 'text'],
            'text on tag' => [Scope::Tag, '', 'text'],
            'text on deck' => [Scope::Deck, '', 'text'],
            'dismissible (removed)' => [Scope::Global, '', 'dismissible'],
            'logo on tag instance' => [Scope::Tag, '12', 'logo'],
            'text style on tag instance' => [Scope::Tag, '12', 'textStyle'],
        ];
    }

    public function test_tag_instance_accepts_background_overlay_and_height(): void
    {
        $config = $this->valid([
            'background' => ['image' => null],
            'overlay' => ['type' => 'none'],
            'height' => ['preset' => 'auto'],
        ], Scope::Tag, '12');

        $this->assertSame(['background', 'overlay', 'height'], array_keys($config));
    }

    // Background ---------------------------------------------------------------

    public function test_background_defaults_and_image(): void
    {
        $this->assertSame(
            ['background' => ['image' => null, 'position' => 'center']],
            $this->valid(['background' => ['image' => null]])
        );

        $config = $this->valid(['background' => ['image' => self::backgroundImage(), 'position' => 'top']]);
        $this->assertSame(self::backgroundImage(), $config['background']['image']);
    }

    public function test_background_image_must_exist(): void
    {
        $image = ['id' => 'cccccccccccccccc'] + self::backgroundImage();
        $this->assertInvalid(['background' => ['image' => $image]], 'config.background.image', 'image_not_found');

        $image = ['widths' => [640, 1024, 1440]] + self::backgroundImage();
        $this->assertInvalid(['background' => ['image' => $image]], 'config.background.image', 'image_not_found');
    }

    public function test_background_image_must_belong_to_the_target(): void
    {
        $image = ['id' => self::OTHER_ID, 'widths' => [640]] + self::backgroundImage();

        $this->assertInvalid(['background' => ['image' => $image]], 'config.background.image', 'image_not_found');
        $this->assertInvalid(['background' => ['image' => $image]], 'config.background.image', 'image_not_found', Scope::Tag);
        $this->assertEquals($image, $this->valid(['background' => ['image' => $image]], Scope::Tag, '12')['background']['image']);
    }

    #[DataProvider('invalidImageRefs')]
    public function test_background_image_ref_is_strict(array $override, string $path): void
    {
        $image = $override + self::backgroundImage();
        $this->assertInvalid(['background' => ['image' => $image]], "config.background.image.$path", 'invalid_value');
    }

    /**
     * @return array<string, array{array<string, mixed>, string}>
     */
    public static function invalidImageRefs(): array
    {
        return [
            'path traversal id' => [['id' => '../../config.php'], 'id'],
            'uppercase id' => [['id' => 'AAAAAAAAAAAAAAAA'], 'id'],
            'unknown width' => [['widths' => [640, 800]], 'widths'],
            'unsorted widths' => [['widths' => [1024, 640]], 'widths'],
            'duplicated widths' => [['widths' => [640, 640]], 'widths'],
            'empty widths' => [['widths' => []], 'widths'],
            'string width' => [['widths' => ['640']], 'widths'],
            'too large' => [['width' => 5000], 'width'],
        ];
    }

    public function test_image_ref_rejects_unknown_keys(): void
    {
        $image = self::backgroundImage() + ['url' => 'https://evil.example/x.png'];
        $this->assertInvalid(['background' => ['image' => $image]], 'config.background.image.url', 'unknown_key');
    }

    // Overlay ------------------------------------------------------------------

    public function test_overlay_types(): void
    {
        $this->assertSame(['type' => 'none'], $this->valid(['overlay' => ['type' => 'none']])['overlay']);

        $this->assertSame(
            ['type' => 'solid', 'color' => '#00000080'],
            $this->valid(['overlay' => ['type' => 'solid', 'color' => '#00000080']])['overlay']
        );

        $gradient = [
            'type' => 'gradient',
            'angle' => 180,
            'stops' => [['color' => '#000', 'at' => 0], ['color' => '#FFFFFF00', 'at' => 50], ['color' => '#fff', 'at' => 50]],
        ];
        $result = $this->valid(['overlay' => $gradient])['overlay'];
        $this->assertSame('#ffffff00', $result['stops'][1]['color']);
    }

    #[DataProvider('invalidColors')]
    public function test_colors_are_strict(mixed $color): void
    {
        $this->assertInvalid(['overlay' => ['type' => 'solid', 'color' => $color]], 'config.overlay.color', 'invalid_value');
    }

    /**
     * @return array<string, array{mixed}>
     */
    public static function invalidColors(): array
    {
        return [
            'css injection' => ['#fff;background:url(https://evil.example)'],
            'named color' => ['red'],
            'rgb function' => ['rgb(0,0,0)'],
            'expression' => ['expression(alert(1))'],
            'five digits' => ['#12345'],
            'no hash' => ['ffffff'],
            'number' => [0],
            'null' => [null],
        ];
    }

    public function test_overlay_gradient_stops_are_bounded_and_ordered(): void
    {
        $stop = ['color' => '#000', 'at' => 0];

        $this->assertInvalid(
            ['overlay' => ['type' => 'gradient', 'angle' => 0, 'stops' => [$stop]]],
            'config.overlay.stops',
            'not_enough_items'
        );
        $this->assertInvalid(
            ['overlay' => ['type' => 'gradient', 'angle' => 0, 'stops' => array_fill(0, 5, $stop)]],
            'config.overlay.stops',
            'too_many_items'
        );
        $this->assertInvalid(
            ['overlay' => ['type' => 'gradient', 'angle' => 0, 'stops' => [['color' => '#000', 'at' => 60], ['color' => '#000', 'at' => 40]]]],
            'config.overlay.stops.1.at',
            'stops_order'
        );
        $this->assertInvalid(
            ['overlay' => ['type' => 'gradient', 'angle' => 400, 'stops' => [$stop, $stop]]],
            'config.overlay.angle',
            'invalid_value'
        );
    }

    public function test_linear_gradient_goes_along_an_angle_or_from_a_corner(): void
    {
        $stops = [['color' => '#000000', 'at' => 0], ['color' => '#ffffff', 'at' => 100]];

        $this->assertSame(
            ['type' => 'gradient', 'corner' => 'top-left', 'stops' => $stops],
            $this->valid(['overlay' => ['type' => 'gradient', 'corner' => 'top-left', 'stops' => $stops]])['overlay']
        );
        $this->assertInvalid(['overlay' => ['type' => 'gradient', 'corner' => 'middle', 'stops' => $stops]], 'config.overlay.corner', 'invalid_value');
        // Exactly one direction.
        $this->assertInvalid(['overlay' => ['type' => 'gradient', 'stops' => $stops]], 'config.overlay.angle', 'invalid_value');
        $this->assertInvalid(['overlay' => ['type' => 'gradient', 'angle' => 90, 'corner' => 'top-left', 'stops' => $stops]], 'config.overlay.angle', 'invalid_value');
    }

    public function test_radial_gradient(): void
    {
        $stops = [['color' => '#00000000', 'at' => 0], ['color' => '#000000b3', 'at' => 100]];

        $this->assertSame(
            ['type' => 'radial', 'shape' => 'ellipse', 'position' => 'center', 'stops' => $stops],
            $this->valid(['overlay' => ['type' => 'radial', 'stops' => $stops]])['overlay']
        );
        $this->assertSame(
            ['type' => 'radial', 'shape' => 'circle', 'position' => 'bottom-right', 'stops' => $stops],
            $this->valid(['overlay' => ['type' => 'radial', 'shape' => 'circle', 'position' => 'bottom-right', 'stops' => $stops]])['overlay']
        );
        $this->assertInvalid(['overlay' => ['type' => 'radial', 'shape' => 'square', 'stops' => $stops]], 'config.overlay.shape', 'invalid_value');
        $this->assertInvalid(['overlay' => ['type' => 'radial', 'position' => '50% 50%', 'stops' => $stops]], 'config.overlay.position', 'invalid_value');
        $this->assertInvalid(['overlay' => ['type' => 'radial', 'angle' => 90, 'stops' => $stops]], 'config.overlay.angle', 'unknown_key');
    }

    public function test_corners_gradient_has_one_color_per_corner(): void
    {
        $corners = ['type' => 'corners', 'topLeft' => '#FF0000B3', 'topRight' => '#00f', 'bottomLeft' => '#00ff00', 'bottomRight' => '#00000000'];

        $this->assertSame(
            ['type' => 'corners', 'topLeft' => '#ff0000b3', 'topRight' => '#00f', 'bottomLeft' => '#00ff00', 'bottomRight' => '#00000000'],
            $this->valid(['overlay' => $corners])['overlay']
        );
        $this->assertInvalid(['overlay' => ['bottomRight' => 'red'] + $corners], 'config.overlay.bottomRight', 'invalid_value');
        $this->assertInvalid(['overlay' => array_diff_key($corners, ['topLeft' => 0])], 'config.overlay.topLeft', 'missing_key');
        $this->assertInvalid(['overlay' => $corners + ['stops' => []]], 'config.overlay.stops', 'unknown_key');
    }

    public function test_overlay_rejects_keys_of_other_types(): void
    {
        $this->assertInvalid(['overlay' => ['type' => 'none', 'color' => '#000']], 'config.overlay.color', 'unknown_key');
        $this->assertInvalid(['overlay' => ['type' => 'image']], 'config.overlay.type', 'invalid_value');
    }

    // Height -------------------------------------------------------------------

    public function test_height_presets(): void
    {
        $this->assertSame(['preset' => 'm'], $this->valid(['height' => ['preset' => 'm']])['height']);

        $custom = ['preset' => 'custom', 'desktop' => 400, 'tablet' => 300, 'mobile' => 200];
        $this->assertSame($custom, $this->valid(['height' => $custom])['height']);
    }

    public function test_height_is_bounded(): void
    {
        $custom = ['preset' => 'custom', 'desktop' => 400, 'tablet' => 300, 'mobile' => 200];

        $this->assertInvalid(['height' => ['mobile' => 700] + $custom], 'config.height.mobile', 'invalid_value');
        $this->assertInvalid(['height' => ['desktop' => 50] + $custom], 'config.height.desktop', 'invalid_value');
        $this->assertInvalid(['height' => ['tablet' => '300'] + $custom], 'config.height.tablet', 'invalid_value');
        $this->assertInvalid(['height' => ['preset' => 's', 'desktop' => 400]], 'config.height.desktop', 'unknown_key');
        $this->assertInvalid(['height' => ['preset' => 'custom', 'desktop' => 400]], 'config.height.tablet', 'missing_key');
    }

    // Text ---------------------------------------------------------------------

    public function test_text_style_defaults(): void
    {
        $this->assertSame(
            ['align' => 'center', 'vAlign' => 'middle', 'titleSize' => 'm', 'subtitleSize' => 'm', 'color' => null],
            $this->valid(['textStyle' => []])['textStyle']
        );
    }

    public function test_custom_text_is_plain_and_normalized(): void
    {
        $text = $this->valid(['text' => ['title' => '  Hello  ', 'message' => "Line 1\r\nLine 2"]])['text'];

        $this->assertSame(['afterClose' => 'hero', 'title' => 'Hello', 'message' => "Line 1\nLine 2"], $text);
        $this->assertSame(['afterClose' => 'none', 'title' => '', 'message' => ''], $this->valid(['text' => ['afterClose' => 'none']])['text']);
    }

    public function test_custom_text_is_bounded(): void
    {
        $this->assertInvalid(['text' => ['title' => "Two\nlines"]], 'config.text.title', 'invalid_value');
        $this->assertInvalid(['text' => ['title' => str_repeat('é', 101)]], 'config.text.title', 'too_long');
        $this->assertInvalid(['text' => ['message' => "Bell\x07"]], 'config.text.message', 'invalid_value');
        $this->assertInvalid(['text' => ['message' => "\xC3\x28"]], 'config.text.message', 'invalid_value');
        $this->assertInvalid(['text' => ['afterClose' => 'hide']], 'config.text.afterClose', 'invalid_value');
        $this->assertInvalid(['text' => ['source' => 'core']], 'config.text.source', 'unknown_key');
    }

    // Logo ---------------------------------------------------------------------

    public function test_logo_defaults(): void
    {
        $this->assertSame(
            ['image' => self::logoImage(), 'side' => 'left', 'size' => 'm', 'alt' => '', 'hideOnMobile' => false],
            $this->valid(['logo' => ['image' => self::logoImage()]])['logo']
        );
    }

    public function test_logo_requires_an_existing_image_or_null(): void
    {
        $this->assertNull($this->valid(['logo' => ['image' => null]])['logo']['image']);
        $this->assertInvalid(['logo' => []], 'config.logo.image', 'missing_key');
        $this->assertInvalid(['logo' => ['image' => ['id' => self::BG_ID] + self::logoImage()]], 'config.logo.image', 'image_not_found');
    }

    // Social icons -------------------------------------------------------------

    public function test_social_links_accept_web_mail_and_phone(): void
    {
        $items = [
            ['icon' => 'fab fa-github', 'url' => 'https://github.com/WalsGit', 'label' => 'GitHub'],
            ['icon' => 'fa-solid fa-envelope', 'url' => 'mailto:contact@example.com', 'label' => 'Email'],
            ['icon' => 'fas fa-phone', 'url' => 'tel:+33 1 23 45 67 89', 'label' => 'Phone'],
        ];

        $socials = $this->valid(['socials' => ['items' => $items]])['socials'];

        $this->assertSame('s', $socials['size']);
        $this->assertSame('below-text', $socials['placement']);
        $this->assertSame('same', $socials['mobile']);
        $this->assertSame($items, $socials['items']);
    }

    public function test_social_icons_mobile_behavior_is_checked(): void
    {
        $this->assertSame('hide', $this->valid(['socials' => ['mobile' => 'hide', 'items' => []]])['socials']['mobile']);
        $this->assertInvalid(['socials' => ['mobile' => 'top-left', 'items' => []]], 'config.socials.mobile', 'invalid_value');
    }

    #[DataProvider('invalidSocialUrls')]
    public function test_social_urls_are_strict(string $url): void
    {
        $this->assertInvalid(
            ['socials' => ['items' => [['icon' => 'fab fa-x-twitter', 'url' => $url, 'label' => 'X']]]],
            'config.socials.items.0.url',
            'invalid_value'
        );
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidSocialUrls(): array
    {
        return [
            'javascript' => ['javascript:alert(1)'],
            'javascript uppercase' => ['JavaScript:alert(1)'],
            'data' => ['data:text/html,<script>alert(1)</script>'],
            'relative' => ['/u/admin'],
            'protocol relative' => ['//evil.example'],
            'ftp' => ['ftp://example.com'],
            'with spaces' => ['https://example.com/a b'],
            'bad mail' => ['mailto:not-an-email'],
            'mail with header' => ['mailto:a@example.com?bcc=b@example.com'],
            'phone with letters' => ['tel:call-me'],
            'empty phone' => ['tel:'],
        ];
    }

    public function test_social_items_are_checked(): void
    {
        $item = ['icon' => 'fab fa-github', 'url' => 'https://github.com', 'label' => 'GitHub'];

        $this->assertInvalid(['socials' => ['items' => array_fill(0, 11, $item)]], 'config.socials.items', 'too_many_items');
        $this->assertInvalid(['socials' => ['items' => [['label' => ' '] + $item]]], 'config.socials.items.0.label', 'missing_key');
        $this->assertInvalid(['socials' => ['items' => [['icon' => 'fab fa-github" onclick="x'] + $item]]], 'config.socials.items.0.icon', 'invalid_value');
        $this->assertInvalid(['socials' => ['items' => [['icon' => 'fa fa-github'] + $item]]], 'config.socials.items.0.icon', 'invalid_value');
        $this->assertInvalid(['socials' => ['items' => [['url' => 'https://example.com/'.str_repeat('a', 300)] + $item]]], 'config.socials.items.0.url', 'too_long');
    }

    // Buttons ------------------------------------------------------------------

    public function test_link_button_defaults(): void
    {
        $buttons = $this->valid(['buttons' => ['items' => [['label' => 'Docs', 'action' => 'link', 'url' => 'https://example.com']]]])['buttons'];

        $this->assertSame([
            'placement' => 'below-text',
            'mobile' => 'same',
            'items' => [[
                'label' => 'Docs', 'icon' => null, 'action' => 'link',
                'url' => 'https://example.com', 'newTab' => false, 'visibility' => 'all',
                'style' => 'primary', 'size' => 'm', 'bg' => null, 'color' => null,
            ]],
        ], $buttons);
    }

    public function test_login_and_signup_buttons_have_no_url_nor_visibility(): void
    {
        $buttons = $this->valid(['buttons' => ['items' => [
            ['label' => 'Log in', 'action' => 'login'],
            ['label' => 'Sign up', 'action' => 'signup', 'icon' => 'fas fa-user-plus', 'bg' => '#E7672E'],
        ]]])['buttons'];

        $this->assertArrayNotHasKey('url', $buttons['items'][0]);
        $this->assertSame('#e7672e', $buttons['items'][1]['bg']);

        $this->assertInvalid(
            ['buttons' => ['items' => [['label' => 'Log in', 'action' => 'login', 'url' => 'https://example.com']]]],
            'config.buttons.items.0.url',
            'unknown_key'
        );
        $this->assertInvalid(
            ['buttons' => ['items' => [['label' => 'Log in', 'action' => 'login', 'visibility' => 'user']]]],
            'config.buttons.items.0.visibility',
            'unknown_key'
        );
    }

    public function test_buttons_are_checked(): void
    {
        $link = ['label' => 'Docs', 'action' => 'link', 'url' => 'https://example.com'];

        $this->assertInvalid(['buttons' => ['items' => [['url' => 'javascript:alert(1)'] + $link]]], 'config.buttons.items.0.url', 'invalid_value');
        $this->assertInvalid(['buttons' => ['items' => [['url' => 'mailto:a@example.com'] + $link]]], 'config.buttons.items.0.url', 'invalid_value');
        $this->assertInvalid(['buttons' => ['items' => [['icon' => 'x" onmouseover="alert(1)'] + $link]]], 'config.buttons.items.0.icon', 'invalid_value');
        $this->assertInvalid(['buttons' => ['items' => [['action' => 'delete'] + $link]]], 'config.buttons.items.0.action', 'invalid_value');
        $this->assertInvalid(['buttons' => ['items' => array_fill(0, 5, $link)]], 'config.buttons.items', 'too_many_items');
        $this->assertInvalid(['buttons' => ['items' => [['label' => str_repeat('a', 41)] + $link]]], 'config.buttons.items.0.label', 'too_long');
        $this->assertInvalid(['buttons' => ['items' => [['style' => 'danger'] + $link]]], 'config.buttons.items.0.style', 'invalid_value');
        $this->assertInvalid(['buttons' => ['mobile' => 'top-left', 'items' => []]], 'config.buttons.mobile', 'invalid_value');
        $this->assertSame('outline', $this->valid(['buttons' => ['items' => [['style' => 'outline'] + $link]]])['buttons']['items'][0]['style']);
    }

    public function test_tags_and_discussions_can_show_the_default_buttons(): void
    {
        $this->assertSame('inherit', $this->valid(['buttons' => 'inherit'], Scope::Messages)['buttons']);
        $this->assertSame('inherit', $this->valid(['buttons' => 'inherit'], Scope::Deck)['buttons']);
        $this->assertSame('inherit', $this->valid(['buttons' => 'inherit'], Scope::Tag)['buttons']);
        $this->assertSame('inherit', $this->valid(['buttons' => 'inherit'], Scope::Discussion)['buttons']);
        $this->assertInvalid(['buttons' => 'inherit'], 'config.buttons', 'invalid_value');
    }

    // Placements ---------------------------------------------------------------

    public function test_buttons_and_socials_cannot_share_a_corner(): void
    {
        $config = [
            'socials' => ['placement' => 'top-left', 'items' => []],
            'buttons' => ['placement' => 'top-left', 'items' => []],
        ];

        $this->assertInvalid($config, 'config.buttons.placement', 'placement_conflict');
    }

    public function test_buttons_and_socials_can_share_below_text_or_use_different_corners(): void
    {
        $this->valid([
            'socials' => ['placement' => 'below-text', 'items' => []],
            'buttons' => ['placement' => 'below-text', 'items' => []],
        ]);

        $config = $this->valid([
            'socials' => ['placement' => 'top-left', 'items' => []],
            'buttons' => ['placement' => 'bottom-right', 'items' => []],
        ]);

        $this->assertSame('bottom-right', $config['buttons']['placement']);
    }

    // Misc ---------------------------------------------------------------------

    public function test_all_errors_are_reported(): void
    {
        try {
            $this->valid(['dismissible' => 1, 'height' => ['preset' => 'xxl'], 'unknown' => true]);
            $this->fail('Expected a validation error.');
        } catch (ValidationException $e) {
            $this->assertSame(
                ['config.dismissible', 'config.height.preset', 'config.unknown'],
                array_keys($e->getAttributes())
            );
        }
    }
}
