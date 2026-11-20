<?php

/*
 * This file is part of walsgit/flarum-custom-heroes.
 *
 * Copyright (c) 2026 Wa!id.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Walsgit\CustomHeroes\Image;

use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use GuzzleHttp\RequestOptions;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\UriInterface;
use RuntimeException;
use Throwable;

/**
 * Downloads a remote image, hardened against SSRF. Ported from
 * walsgit/flarum-discussion-cards (keep security fixes in sync).
 *
 * - http/https only, on ports 80 and 443 only, no credentials in the URL
 * - hard timeouts and a maximum download size (enforced while streaming)
 * - refuses non public addresses (private, loopback, link-local, reserved...),
 *   checked on the IPs the host name resolves to, and the validated IP is the
 *   one the connection is made to (no second DNS lookup)
 * - redirects are followed manually and every hop goes through the same checks
 */
final class RemoteImageFetcher
{
    public const MAX_BYTES = 5 * 1024 * 1024;

    private const CONNECT_TIMEOUT = 3; // seconds
    private const TOTAL_TIMEOUT = 10;  // seconds, all redirect hops included
    private const MAX_REDIRECTS = 3;
    private const ALLOWED_PORTS = [80, 443];

    /** Address ranges that are never fetched (CIDR notation). */
    private const BLOCKED_RANGES = [
        // IPv4
        '0.0.0.0/8',        // "this network"
        '10.0.0.0/8',       // private
        '100.64.0.0/10',    // carrier-grade NAT
        '127.0.0.0/8',      // loopback
        '169.254.0.0/16',   // link-local (cloud metadata services live here)
        '172.16.0.0/12',    // private
        '192.0.0.0/24',     // IETF protocol assignments
        '192.0.2.0/24',     // documentation
        '192.168.0.0/16',   // private
        '198.18.0.0/15',    // benchmarking
        '198.51.100.0/24',  // documentation
        '203.0.113.0/24',   // documentation
        '224.0.0.0/4',      // multicast
        '240.0.0.0/4',      // reserved
        // IPv6
        '::/96',            // unspecified, loopback and IPv4-compatible
        '64:ff9b:1::/48',   // NAT64 local-use prefix (RFC 8215)
        '100::/64',         // discard-only
        '2001::/32',        // Teredo
        '2001:db8::/32',    // documentation
        '2002::/16',        // 6to4
        'fc00::/7',         // unique local (private)
        'fe80::/10',        // link-local
        'ff00::/8',         // multicast
    ];

    public function __construct(
        private readonly Client $client = new Client(),
    ) {
    }

    /**
     * Downloads a remote file into $targetPath (an existing, writable file).
     * Returns false if the URL is refused, the request fails or the file is
     * too big.
     */
    public function download(string $url, string $targetPath): bool
    {
        // Without curl the connection cannot be pinned to the validated IP,
        // which would reopen DNS rebinding: refuse instead.
        if (! extension_loaded('curl')) {
            return false;
        }

        $deadline = microtime(true) + self::TOTAL_TIMEOUT;

        try {
            $uri = new Uri($url);

            for ($hop = 0; $hop <= self::MAX_REDIRECTS; $hop++) {
                $response = $this->send($uri, $deadline, $targetPath);

                if (! $this->isRedirect($response)) {
                    clearstatcache(true, $targetPath);
                    $size = (int) @filesize($targetPath);

                    return $this->isSuccess($response) && $size > 0 && $size <= self::MAX_BYTES;
                }

                $uri = UriResolver::resolve($uri, new Uri($response->getHeaderLine('Location')));
            }
        } catch (Throwable) {
            // Refused target, network error, timeout, file too big...: all end up as a failure.
        }

        return false; // failure, or too many redirects
    }

    /**
     * Sends one request (no redirect handling). The target is validated first.
     *
     * @throws Throwable when the target is refused or the request fails
     */
    private function send(UriInterface $uri, float $deadline, string $targetPath): ResponseInterface
    {
        $resolveEntry = $this->assertSafeTarget($uri);
        $remaining = $deadline - microtime(true);

        if ($remaining <= 0) {
            throw new RuntimeException('Timeout reached');
        }

        $options = [
            RequestOptions::ALLOW_REDIRECTS => false,
            RequestOptions::HTTP_ERRORS => false,
            RequestOptions::DECODE_CONTENT => false, // the size cap must apply to the real bytes
            RequestOptions::CONNECT_TIMEOUT => min(self::CONNECT_TIMEOUT, $remaining),
            RequestOptions::TIMEOUT => $remaining,
            RequestOptions::SINK => $targetPath,
            RequestOptions::HEADERS => [
                'User-Agent' => 'Flarum Custom Heroes (+https://github.com/WalsGit/flarum-custom-heroes)',
                'Accept' => 'image/*,*/*;q=0.5',
            ],
            RequestOptions::ON_HEADERS => function (ResponseInterface $response) {
                // Redirect: the next hop is handled by the caller.
                if ($this->isRedirect($response)) {
                    return;
                }

                if (! $this->isSuccess($response)) {
                    throw new RuntimeException('Not a successful response');
                }

                $length = $response->getHeaderLine('Content-Length');

                if (ctype_digit($length) && (int) $length > self::MAX_BYTES) {
                    throw new RuntimeException('Remote file too large');
                }
            },
            // Protects against a missing or wrong Content-Length.
            RequestOptions::PROGRESS => function (int|float $total, int|float $downloaded) {
                if ($downloaded > self::MAX_BYTES) {
                    throw new RuntimeException('Remote file too large');
                }
            },
        ];

        // Connect to the IP we validated, not to whatever the name resolves to a second time.
        if ($resolveEntry !== null) {
            $options['curl'] = [CURLOPT_RESOLVE => [$resolveEntry]];
        }

        return $this->client->request('GET', $uri, $options);
    }

    private function isRedirect(ResponseInterface $response): bool
    {
        $status = $response->getStatusCode();

        return $status >= 300 && $status < 400 && $response->hasHeader('Location');
    }

    private function isSuccess(ResponseInterface $response): bool
    {
        $status = $response->getStatusCode();

        return $status >= 200 && $status < 300;
    }

    /**
     * Throws if the URL must not be requested.
     *
     * @return string|null a CURLOPT_RESOLVE entry pinning the host to a validated IP (null for IP literals)
     */
    private function assertSafeTarget(UriInterface $uri): ?string
    {
        $scheme = strtolower($uri->getScheme());

        if (! in_array($scheme, ['http', 'https'], true)) {
            throw new RuntimeException('Unsupported scheme');
        }

        if ($uri->getUserInfo() !== '') {
            throw new RuntimeException('Credentials in URL are not allowed');
        }

        // IPv6 literals come wrapped in brackets.
        $host = trim($uri->getHost(), '[]');

        if ($host === '') {
            throw new RuntimeException('Missing host');
        }

        $port = $uri->getPort() ?? ($scheme === 'https' ? 443 : 80);

        if (! in_array($port, self::ALLOWED_PORTS, true)) {
            throw new RuntimeException('Port not allowed');
        }

        // IP literal: nothing to resolve.
        if (filter_var($host, FILTER_VALIDATE_IP) !== false) {
            $this->assertPublicIps([$host]);

            return null;
        }

        $ips = $this->resolveHost($host);

        if ($ips === []) {
            throw new RuntimeException('Host could not be resolved');
        }

        $this->assertPublicIps($ips);

        $ip = $ips[0];

        return sprintf('%s:%d:%s', $host, $port, str_contains($ip, ':') ? "[$ip]" : $ip);
    }

    /**
     * All addresses must be public (a mixed DNS answer is refused).
     *
     * @param list<string> $ips
     */
    private function assertPublicIps(array $ips): void
    {
        foreach ($ips as $ip) {
            if (! $this->isPublicIp($ip)) {
                throw new RuntimeException('Address not allowed');
            }
        }
    }

    /**
     * @return list<string> resolved IP addresses, IPv4 first
     */
    private function resolveHost(string $host): array
    {
        $ips = [];
        $records = @dns_get_record($host, DNS_A | DNS_AAAA);

        if (is_array($records)) {
            foreach ($records as $record) {
                $ip = $record['ip'] ?? $record['ipv6'] ?? null;

                if (is_string($ip) && $ip !== '') {
                    $ips[] = $ip;
                }
            }
        }

        // Fallback on the system resolver (also reads the hosts file), IPv4 only.
        if ($ips === []) {
            $ips = @gethostbynamel($host) ?: [];
        }

        $ips = array_values(array_unique($ips));
        usort($ips, fn (string $a, string $b) => str_contains($a, ':') <=> str_contains($b, ':'));

        return $ips;
    }

    private function isPublicIp(string $ip): bool
    {
        $packed = @inet_pton($ip);

        if ($packed === false) {
            return false;
        }

        // IPv4-mapped IPv6 address (::ffff:a.b.c.d): check the embedded IPv4 address instead.
        if (strlen($packed) === 16 && str_starts_with($packed, str_repeat("\0", 10)."\xff\xff")) {
            return $this->isPublicIp((string) inet_ntop(substr($packed, 12)));
        }

        // NAT64 well-known prefix 64:ff9b::/96 (RFC 6052): the real destination
        // is the embedded IPv4 address (last 4 bytes), so check that one instead.
        if (strlen($packed) === 16 && str_starts_with($packed, "\x00\x64\xff\x9b".str_repeat("\0", 8))) {
            return $this->isPublicIp((string) inet_ntop(substr($packed, 12)));
        }

        foreach (self::BLOCKED_RANGES as $range) {
            if ($this->ipInRange($packed, $range)) {
                return false;
            }
        }

        return true;
    }

    private function ipInRange(string $packedIp, string $cidr): bool
    {
        [$subnet, $bits] = explode('/', $cidr);
        $packedSubnet = inet_pton($subnet);

        // IPv4 address vs IPv6 range (or the opposite): never in range.
        if ($packedSubnet === false || strlen($packedSubnet) !== strlen($packedIp)) {
            return false;
        }

        $bits = (int) $bits;
        $fullBytes = intdiv($bits, 8);
        $remainingBits = $bits % 8;

        if (substr($packedIp, 0, $fullBytes) !== substr($packedSubnet, 0, $fullBytes)) {
            return false;
        }

        // Whole bytes are equal: compare the few remaining bits, if any.
        $mask = (0xFF << (8 - $remainingBits)) & 0xFF;

        return $remainingBits === 0
            || (ord($packedIp[$fullBytes]) & $mask) === (ord($packedSubnet[$fullBytes]) & $mask);
    }
}
