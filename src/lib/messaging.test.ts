import { describe, expect, it } from 'vitest';
import { buildSmsLink, buildWhatsAppLink, renderTemplate } from './messaging';

const PHONE = '+2348031234567';

describe('buildWhatsAppLink', () => {
  it('opens a specific chat when given a number (no plus sign)', () => {
    expect(buildWhatsAppLink(PHONE, 'Hi there')).toBe('https://wa.me/2348031234567?text=Hi%20there');
  });
  it('lets the person choose a contact when there is no number', () => {
    expect(buildWhatsAppLink(null, 'Hi')).toBe('https://wa.me/?text=Hi');
    expect(buildWhatsAppLink(undefined, 'Hi')).toBe('https://wa.me/?text=Hi');
  });
  it('encodes special characters, emoji and links', () => {
    const link = buildWhatsAppLink(PHONE, 'Hi! 👋 https://x.com/pass/ab?c=1&d=2');
    expect(link).toContain('text=Hi!%20%F0%9F%91%8B%20https%3A%2F%2Fx.com%2Fpass%2Fab%3Fc%3D1%26d%3D2');
  });
});

describe('buildSmsLink', () => {
  it('uses ?body= on Android and other platforms', () => {
    expect(buildSmsLink(PHONE, 'Hi there', 'other')).toBe('sms:+2348031234567?body=Hi%20there');
  });
  it('uses &body= on iOS', () => {
    expect(buildSmsLink(PHONE, 'Hi there', 'ios')).toBe('sms:+2348031234567&body=Hi%20there');
  });
  it('works without a recipient', () => {
    expect(buildSmsLink(null, 'Hi', 'other')).toBe('sms:?body=Hi');
    expect(buildSmsLink(null, 'Hi', 'ios')).toBe('sms:&body=Hi');
  });
});

describe('renderTemplate', () => {
  it('fills known placeholders', () => {
    expect(renderTemplate('Hi {name}, see {link}', { name: 'Ada', link: 'https://x.co' })).toBe(
      'Hi Ada, see https://x.co',
    );
  });
  it('fills a placeholder used more than once', () => {
    expect(renderTemplate('{a}-{a}', { a: '1' })).toBe('1-1');
  });
  it('leaves unknown placeholders as they are', () => {
    expect(renderTemplate('Hi {name} {oops}', { name: 'Ada' })).toBe('Hi Ada {oops}');
  });
  it('does not treat object prototype keys as placeholders', () => {
    expect(renderTemplate('{toString}', {})).toBe('{toString}');
  });
});