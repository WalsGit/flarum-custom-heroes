import app from 'flarum/admin/app';
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

  it('translates the label of a generic icon, and still replaces it', () => {
    // A stand-in translator: the label is the last part of the key.
    app.translator.trans = ((key: string) => `[${key.split('.').pop()}]`) as typeof app.translator.trans;
    const email = withIcon(empty, 'fas fa-envelope');

    expect(email).toEqual({ icon: 'fas fa-envelope', label: '[email]', url: 'mailto:' });
    expect(withIcon(email, 'fas fa-phone')).toEqual({ icon: 'fas fa-phone', label: '[phone]', url: 'tel:' });
  });
});
