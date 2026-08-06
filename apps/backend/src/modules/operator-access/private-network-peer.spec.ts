import { describe, expect, test } from 'vitest';
import {
  isPrivateNetworkPeer,
  normalizeSocketPeerAddress,
} from './private-network-peer';

describe('private-network peer classifier', () => {
  test('accepts loopback, RFC1918, unique-local, and link-local peers', () => {
    const accepted = [
      '127.0.0.1',
      '127.1.2.3',
      '10.0.0.1',
      '10.255.255.255',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.0.1',
      '192.168.255.255',
      '::1',
      'fc00::1',
      'fd12:3456:789a::1',
      'fe80::1',
      'fe80::abcd:1',
      '::ffff:127.0.0.1',
      '::ffff:10.0.0.2',
      '::ffff:192.168.1.10',
    ];

    for (const address of accepted) {
      expect(isPrivateNetworkPeer(address), address).toBe(true);
    }
  });

  test('rejects public and malformed addresses', () => {
    const rejected = [
      undefined,
      '',
      '   ',
      'not-an-ip',
      '203.0.113.10',
      '8.8.8.8',
      '1.1.1.1',
      '172.15.0.1',
      '172.32.0.1',
      '192.169.0.1',
      '169.254.1.1',
      '2001:db8::1',
      '2606:4700:4700::1111',
      '::ffff:203.0.113.10',
      '::ffff:8.8.8.8',
    ];

    for (const address of rejected) {
      expect(isPrivateNetworkPeer(address), String(address)).toBe(false);
    }
  });

  test('normalizes IPv4-mapped IPv6 addresses', () => {
    expect(normalizeSocketPeerAddress('::ffff:10.0.0.1')).toBe('10.0.0.1');
    expect(normalizeSocketPeerAddress('  ::FFFF:192.168.1.1  ')).toBe(
      '192.168.1.1',
    );
    expect(normalizeSocketPeerAddress(undefined)).toBeUndefined();
    expect(normalizeSocketPeerAddress('')).toBeUndefined();
  });
});
