import type { InterviewQuestion, Topic, Track } from "../content/questions.ts";

type ResolveActiveTrackOptions = {
  requestedTrack: string | null;
  tracks: Track[];
  activeTrackIds: string[];
  preferenceTrackIds: string[];
  defaultTrackId: string | null;
  authenticated: boolean;
};

export type ActiveTrackResolution = {
  activeTrack: Track | null;
  selectableTracks: Track[];
  invalidTrack: boolean;
};

export function resolveActiveTrack(options: ResolveActiveTrackOptions): ActiveTrackResolution {
  const activeIds = new Set(options.activeTrackIds);
  const preferenceIds = new Set(options.preferenceTrackIds);
  const selectableTracks = options.tracks.filter((track) =>
    activeIds.has(track.id) && (!options.authenticated || preferenceIds.has(track.id)),
  );
  const requested = options.requestedTrack
    ? selectableTracks.find((track) => track.id === options.requestedTrack || track.slug === options.requestedTrack)
    : null;
  if (options.requestedTrack && !requested) return { activeTrack: null, selectableTracks, invalidTrack: true };
  const defaultTrack = selectableTracks.find((track) => track.id === options.defaultTrackId);
  return { activeTrack: requested ?? defaultTrack ?? selectableTracks[0] ?? null, selectableTracks, invalidTrack: false };
}

export function scopeCatalogue<T extends Pick<Topic, "trackId" | "id" | "slug">, Q extends Pick<InterviewQuestion, "trackId" | "topicIds">>(
  activeTrackId: string,
  requestedTopic: string | null,
  allTopics: T[],
  allQuestions: Q[],
): { topics: T[]; questions: Q[]; invalidTopic: boolean } {
  const topics = allTopics.filter((topic) => topic.trackId === activeTrackId);
  return {
    topics,
    questions: allQuestions.filter((question) => question.trackId === activeTrackId),
    invalidTopic: Boolean(requestedTopic && !topics.some((topic) => topic.id === requestedTopic || topic.slug === requestedTopic)),
  };
}

export function withTrack(path: string, trackSlug: string): string {
  return withQueryContext(path, "", trackSlug);
}

export function withQueryContext(path: string, contextQuery: string, trackSlug?: string): string {
  const [pathname, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(contextQuery);
  new URLSearchParams(query).forEach((value, key) => params.set(key, value));
  if (trackSlug) params.set("track", trackSlug);
  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}
