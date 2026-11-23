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

use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use PHPUnit\Framework\Attributes\Test;
use Psr\Http\Message\ResponseInterface;

class SaveConfigTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('walsgit-custom-heroes');

        $this->prepareDatabase([
            'users' => [
                $this->normalUser(), // id 2, the admin (id 1) exists by default
            ],
        ]);
    }

    /**
     * @param array<string, mixed> $json
     */
    private function save(array $json, ?int $actorId = 1): ResponseInterface
    {
        $options = ['json' => $json];

        if ($actorId !== null) {
            $options['authenticatedAs'] = $actorId;
        }

        return $this->send($this->request('POST', '/api/walsgit-custom-heroes/configs', $options));
    }

    /**
     * @return array<string, mixed>
     */
    private function forumPayload(): array
    {
        $response = $this->send($this->request('GET', '/api'));
        $this->assertSame(200, $response->getStatusCode());

        return json_decode((string) $response->getBody(), true)['data']['attributes']['walsgitCustomHeroes'];
    }

    /**
     * @return array<string, mixed>
     */
    private function body(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true);
    }

    #[Test]
    public function forum_payload_is_empty_by_default(): void
    {
        $payload = $this->forumPayload();

        $this->assertSame([], $payload['configs']);
        $this->assertStringEndsWith('/assets/extensions/walsgit-custom-heroes', $payload['assetsUrl']);
    }

    #[Test]
    public function upload_limits_are_only_sent_to_admins(): void
    {
        $guest = json_decode((string) $this->send($this->request('GET', '/api'))->getBody(), true);
        $admin = json_decode((string) $this->send($this->request('GET', '/api', ['authenticatedAs' => 1]))->getBody(), true);

        $this->assertArrayNotHasKey('walsgitCustomHeroesUpload', $guest['data']['attributes']);
        $this->assertGreaterThan(0, $admin['data']['attributes']['walsgitCustomHeroesUpload']['maxSize']);
        $this->assertIsBool($admin['data']['attributes']['walsgitCustomHeroesUpload']['webp']);
    }

    #[Test]
    public function guest_cannot_save_a_config(): void
    {
        $response = $this->save(['scope' => 'welcome', 'config' => ['text' => ['afterClose' => 'none']]], null);

        $this->assertGreaterThanOrEqual(400, $response->getStatusCode());
        $this->assertSame([], $this->forumPayload()['configs']);
    }

    #[Test]
    public function non_admin_cannot_save_a_config(): void
    {
        $response = $this->save(['scope' => 'welcome', 'config' => ['text' => ['afterClose' => 'none']]], 2);

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame([], $this->forumPayload()['configs']);
    }

    #[Test]
    public function admin_can_save_a_config_and_the_forum_receives_it(): void
    {
        $response = $this->save(['scope' => 'welcome', 'config' => ['textStyle' => ['align' => 'left']]]);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('left', $this->body($response)['config']['textStyle']['align']);

        // Normalized with the defaults, and visible to guests too.
        $configs = $this->forumPayload()['configs'];
        $this->assertSame('middle', $configs['welcome']['textStyle']['vAlign']);
    }

    #[Test]
    public function admin_can_save_a_tag_instance_config(): void
    {
        $response = $this->save(['scope' => 'tag', 'scopeId' => '12', 'config' => ['height' => ['preset' => 'l']]]);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(['height' => ['preset' => 'l']], $this->forumPayload()['configs']['tag:12']);
    }

    #[Test]
    public function saving_again_replaces_the_config(): void
    {
        $this->save(['scope' => 'global', 'config' => ['height' => ['preset' => 's']]]);
        $this->save(['scope' => 'global', 'config' => ['overlay' => ['type' => 'none']]]);

        $this->assertSame(['overlay' => ['type' => 'none']], $this->forumPayload()['configs']['global']);
    }

    #[Test]
    public function null_or_empty_config_deletes_the_stored_one(): void
    {
        $this->save(['scope' => 'global', 'config' => ['height' => ['preset' => 's']]]);
        $this->save(['scope' => 'welcome', 'config' => ['text' => ['afterClose' => 'none']]]);

        $this->assertSame(200, $this->save(['scope' => 'global', 'config' => null])->getStatusCode());
        $this->assertSame(200, $this->save(['scope' => 'welcome', 'config' => []])->getStatusCode());

        $this->assertSame([], $this->forumPayload()['configs']);
    }

    #[Test]
    public function invalid_config_is_rejected_with_the_path_of_the_error(): void
    {
        $response = $this->save(['scope' => 'welcome', 'config' => ['overlay' => ['type' => 'solid', 'color' => 'red;x']]]);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertStringContainsString('config.overlay.color', (string) $response->getBody());
        $this->assertSame([], $this->forumPayload()['configs']);
    }

    #[Test]
    public function unknown_scope_or_invalid_scope_id_is_rejected(): void
    {
        $this->assertSame(422, $this->save(['scope' => 'user', 'config' => []])->getStatusCode());
        $this->assertSame(422, $this->save(['config' => []])->getStatusCode());
        $this->assertSame(422, $this->save(['scope' => 'welcome', 'scopeId' => '3', 'config' => []])->getStatusCode());
        $this->assertSame(422, $this->save(['scope' => 'tag', 'scopeId' => 12, 'config' => []])->getStatusCode());
        $this->assertSame(422, $this->save(['scope' => 'tag', 'scopeId' => '../1', 'config' => null])->getStatusCode());
    }
}
