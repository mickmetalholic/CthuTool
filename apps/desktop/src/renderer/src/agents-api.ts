import type { PublicAgentStatus } from '@cthutool/agent-protocol';

export type ConnectedAgentsResponse = {
  readonly agents: PublicAgentStatus[];
};

export type BrowserSiteSummary = {
  readonly siteId: string;
  readonly displayName: string;
  readonly allowedOrigins: readonly string[];
  readonly authPolicy: 'anonymous' | 'required';
  readonly loginUrl?: string;
  readonly profileName?: string;
  readonly verifyUrl?: string;
};

export type BrowserProfileSummary = {
  readonly siteId: string;
  readonly profileName: string;
  readonly status: string;
  readonly displayName?: string;
  readonly externalUserId?: string;
  readonly verifiedAt?: string;
  readonly updatedAt: string;
};

export type BrowserStatus = {
  readonly profiles: BrowserProfileSummary[];
  readonly sites: BrowserSiteSummary[];
};

export type DoubanMoviePerson = {
  readonly name: string;
  readonly url?: string;
};

export type DoubanMovieInfo = {
  readonly aliases: readonly string[];
  readonly capturedAt: string;
  readonly casts: readonly DoubanMoviePerson[];
  readonly countries: readonly string[];
  readonly directors: readonly DoubanMoviePerson[];
  readonly finalUrl: string;
  readonly genres: readonly string[];
  readonly imdbId?: string;
  readonly languages: readonly string[];
  readonly originalTitle?: string;
  readonly posterUrl?: string;
  readonly rating?: number;
  readonly ratingCount?: number;
  readonly releaseDates: readonly string[];
  readonly runtime?: string;
  readonly runtimeMinutes?: number;
  readonly sourceUrl: string;
  readonly subjectId: string;
  readonly summary?: string;
  readonly title: string;
  readonly writers: readonly DoubanMoviePerson[];
  readonly year?: number;
};

export type DoubanMovieInfoResponse = {
  readonly movie: DoubanMovieInfo;
};

export async function fetchConnectedAgents(
  backendUrl: string,
): Promise<PublicAgentStatus[]> {
  const response = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/agents`);
  if (!response.ok) {
    throw new Error(`Agent list request failed (${response.status})`);
  }
  const body = (await response.json()) as ConnectedAgentsResponse;
  return body.agents;
}

export async function fetchBrowserStatus(
  _backendUrl: string,
): Promise<BrowserStatus> {
  return {
    profiles: [],
    sites: [],
  };
}

export async function fetchDoubanMovieInfo(
  backendUrl: string,
  input: string,
): Promise<DoubanMovieInfo> {
  const baseUrl = backendUrl.replace(/\/+$/, '');
  const response = await fetch(
    `${baseUrl}/api/douban/movies?input=${encodeURIComponent(input)}`,
  );
  const body = (await response.json()) as
    | DoubanMovieInfoResponse
    | { readonly message?: string };
  if (!response.ok) {
    throw new Error(
      'message' in body && body.message
        ? body.message
        : `Douban movie request failed (${response.status})`,
    );
  }
  if (!('movie' in body)) {
    throw new Error('Douban movie response is missing movie data');
  }
  return body.movie;
}
