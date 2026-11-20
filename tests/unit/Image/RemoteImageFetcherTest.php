<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Tests\unit\Image;

use Flarum\Testing\unit\TestCase;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\Attributes\DataProvider;
use Walsgit\CustomHeroes\Image\RemoteImageFetcher;

class RemoteImageFetcherTest extends TestCase
{
    // A public IP literal: no DNS lookup, and the mock handler never touches the network.
    private const PUBLIC_URL = 'https://93.184.215.14/hero.png';

    private string $target;

    protected function setUp(): void
    {
        parent::setUp();

        $this->target = (string) tempnam(sys_get_temp_dir(), 'wch');
    }

    protected function tearDown(): void
    {
        @unlink($this->target);

        parent::tearDown();
    }

    /**
     * @param list<Response> $responses
     */
    private function fetcher(array $responses, ?MockHandler &$mock = null): RemoteImageFetcher
    {
        $mock = new MockHandler($responses);

        return new RemoteImageFetcher(new Client(['handler' => HandlerStack::create($mock)]));
    }

    #[DataProvider('refusedUrls')]
    public function test_refused_urls_are_never_requested(string $url): void
    {
        $fetcher = $this->fetcher([new Response(200, [], 'image')], $mock);

        $this->assertFalse($fetcher->download($url, $this->target));
        $this->assertCount(1, $mock, 'The URL must not be requested.');
    }

    /**
     * @return array<string, array{string}>
     */
    public static function refusedUrls(): array
    {
        return [
            'loopback' => ['http://127.0.0.1/x.png'],
            'localhost' => ['http://localhost/x.png'],
            'private' => ['http://10.1.2.3/x.png'],
            'private 192.168' => ['http://192.168.1.1/x.png'],
            'cloud metadata' => ['http://169.254.169.254/latest/meta-data'],
            'ipv6 loopback' => ['http://[::1]/x.png'],
            'ipv4 mapped ipv6' => ['http://[::ffff:127.0.0.1]/x.png'],
            'nat64 private' => ['http://[64:ff9b::7f00:1]/x.png'],
            'other port' => ['http://93.184.215.14:8080/x.png'],
            'ftp' => ['ftp://93.184.215.14/x.png'],
            'file' => ['file:///etc/passwd'],
            'credentials' => ['https://user:pass@93.184.215.14/x.png'],
            'no host' => ['https:///x.png'],
        ];
    }

    public function test_public_url_is_downloaded(): void
    {
        $fetcher = $this->fetcher([new Response(200, [], 'image bytes')]);

        $this->assertTrue($fetcher->download(self::PUBLIC_URL, $this->target));
        $this->assertSame('image bytes', file_get_contents($this->target));
    }

    public function test_redirects_are_checked_at_every_hop(): void
    {
        $fetcher = $this->fetcher([
            new Response(302, ['Location' => 'https://93.184.215.15/other.png']),
            new Response(200, [], 'image bytes'),
        ]);
        $this->assertTrue($fetcher->download(self::PUBLIC_URL, $this->target));

        $fetcher = $this->fetcher([
            new Response(302, ['Location' => 'http://127.0.0.1/admin']),
            new Response(200, [], 'secret'),
        ], $mock);
        $this->assertFalse($fetcher->download(self::PUBLIC_URL, $this->target));
        $this->assertCount(1, $mock, 'The redirect target must not be requested.');
    }

    public function test_too_many_redirects_fail(): void
    {
        $redirect = new Response(302, ['Location' => self::PUBLIC_URL]);

        $this->assertFalse($this->fetcher([$redirect, $redirect, $redirect, $redirect, new Response(200, [], 'x')])->download(self::PUBLIC_URL, $this->target));
    }

    public function test_error_status_empty_body_and_too_large_file_fail(): void
    {
        $this->assertFalse($this->fetcher([new Response(404, [], 'not found')])->download(self::PUBLIC_URL, $this->target));
        $this->assertFalse($this->fetcher([new Response(200, [], '')])->download(self::PUBLIC_URL, $this->target));

        $tooLarge = new Response(200, ['Content-Length' => (string) (RemoteImageFetcher::MAX_BYTES + 1)], 'x');
        $this->assertFalse($this->fetcher([$tooLarge])->download(self::PUBLIC_URL, $this->target));
    }
}
