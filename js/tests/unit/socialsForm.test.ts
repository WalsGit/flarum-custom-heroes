import { withIcon } from '../../src/admin/components/SocialsForm';

describe('withIcon', () => {
  const empty = { icon: '', label: '', url: '' };

  it('fills the label and the start of the link of a suggested icon', () => {
    expect(withIcon(empty, 'fab fa-discord')).toEqual({ icon: 'fab fa-discord', label: 'Discord', url: 'https://discord.gg/' });
  });

  it('replaces what the previous icon filled in', () => {
    const discord = withIcon(empty, 'fab fa-discord');

    expect(withIcon(discord, 'fab fa-x-twitter')).toEqual({ icon: 'fab fa-x-twitter', label: 'X', url: 'https://x.com/' });
  });

  it('keeps a label or a link the admin changed', () => {
    const custom = { icon: 'fab fa-discord', label: 'Join us', url: 'https://discord.gg/abc' };

    expect(withIcon(custom, 'fab fa-x-twitter')).toEqual({ icon: 'fab fa-x-twitter', label: 'Join us', url: 'https://discord.gg/abc' });
  });

  it('changes only the icon for a class that is not suggested', () => {
    expect(withIcon({ icon: 'fab fa-discord', label: 'Discord', url: 'https://discord.gg/' }, 'fab fa-vk')).toEqual({
      icon: 'fab fa-vk',
      label: 'Discord',
      url: 'https://discord.gg/',
    });
  });
});
