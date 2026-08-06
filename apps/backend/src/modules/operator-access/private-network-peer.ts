import { BlockList, isIP } from 'node:net';

const PRIVATE_NETWORK_PEERS = new BlockList();
PRIVATE_NETWORK_PEERS.addSubnet('127.0.0.0', 8, 'ipv4');
PRIVATE_NETWORK_PEERS.addSubnet('10.0.0.0', 8, 'ipv4');
PRIVATE_NETWORK_PEERS.addSubnet('172.16.0.0', 12, 'ipv4');
PRIVATE_NETWORK_PEERS.addSubnet('192.168.0.0', 16, 'ipv4');
PRIVATE_NETWORK_PEERS.addAddress('::1', 'ipv6');
PRIVATE_NETWORK_PEERS.addSubnet('fc00::', 7, 'ipv6');
PRIVATE_NETWORK_PEERS.addSubnet('fe80::', 10, 'ipv6');

/**
 * Normalize a socket peer address for classification.
 * Strips IPv4-mapped IPv6 prefixes so `::ffff:10.0.0.1` is checked as IPv4.
 */
export function normalizeSocketPeerAddress(
  input: string | undefined,
): string | undefined {
  const trimmed = (input ?? '').trim();
  if (!trimmed) {
    return undefined;
  }
  const withoutMappedPrefix = trimmed.replace(/^::ffff:/i, '');
  return withoutMappedPrefix || undefined;
}

/**
 * Returns true when the direct socket peer is loopback or a private-network
 * address (RFC1918 IPv4, IPv6 unique-local, or IPv6 link-local). Public and
 * malformed addresses are rejected.
 */
export function isPrivateNetworkPeer(input: string | undefined): boolean {
  const address = normalizeSocketPeerAddress(input);
  if (!address) {
    return false;
  }
  const family = isIP(address);
  if (family === 4) {
    return PRIVATE_NETWORK_PEERS.check(address, 'ipv4');
  }
  if (family === 6) {
    return PRIVATE_NETWORK_PEERS.check(address, 'ipv6');
  }
  return false;
}
