export function isUrlAllowed(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(url, pattern))
}

export function matchesPattern(url: string, pattern: string): boolean {
  if (pattern === "<all_urls>") {
    return true
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return false
  }

  const match = pattern.match(/^(\*|http|https|file):\/\/([^/]*)(\/.*)$/)
  if (!match) {
    return false
  }

  const [, scheme, hostPattern, pathPattern] = match
  const urlScheme = parsedUrl.protocol.replace(":", "")
  if (scheme !== "*" && scheme !== urlScheme) {
    return false
  }
  if (scheme === "*" && !["http", "https"].includes(urlScheme)) {
    return false
  }

  return hostMatches(parsedUrl.hostname, hostPattern) && wildcardMatches(parsedUrl.pathname, pathPattern)
}

function hostMatches(hostname: string, pattern: string): boolean {
  if (pattern === "*") {
    return true
  }
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(2)
    return hostname === suffix || hostname.endsWith(`.${suffix}`)
  }
  return hostname === pattern
}

function wildcardMatches(value: string, pattern: string): boolean {
  const expression = new RegExp(`^${escapeRegExp(pattern).replace(/\*/g, ".*")}$`)
  return expression.test(value)
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&")
}
