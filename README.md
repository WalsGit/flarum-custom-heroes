# Custom Heroes

![License](https://img.shields.io/badge/license-MIT-blue.svg)

A [Flarum](https://flarum.org) 2.x extension that lets admins customize the hero headers of the forum.

> 🚧 **Work in progress.** This extension is in early development and is not ready for production yet.

## Planned features

- Background image (upload or external URL), optimized to WebP in several sizes.
- Overlay for readability: solid color or gradient (2 to 4 color stops).
- Height per breakpoint (desktop, tablet, mobile), with presets and custom values.
- Logo or side image.
- Welcome hero text: keep the core text or replace it, and adjust its size, alignment and position.
- Social icons (Font Awesome) with links, size and placement.
- Buttons (link, log in, sign up) with custom colors, size, placement and visibility.
- Settings defined globally, per hero type (welcome, tag, …) and per tag (background, overlay and height).
- Live preview in the admin panel.

Only admins can configure the extension.

## Requirements

- Flarum 2.x
- PHP 8.3 or later, with GD or Imagick and WebP support
- Optional: [flarum/tags](https://github.com/flarum/tags) to customize the hero of each tag

## Installation

```sh
composer require walsgit/flarum-custom-heroes:"*"
php flarum migrate
php flarum cache:clear
```

## Updating

```sh
composer update walsgit/flarum-custom-heroes:"*"
php flarum migrate
php flarum cache:clear
```

## Links

- [Source code](https://github.com/WalsGit/flarum-custom-heroes)
- [Report an issue](https://github.com/WalsGit/flarum-custom-heroes/issues)

## License

Released under the [MIT License](LICENSE.md).
