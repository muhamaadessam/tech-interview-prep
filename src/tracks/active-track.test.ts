import assert from "node:assert/strict";
import test from "node:test";

import type { InterviewQuestion, Topic, Track } from "../content/questions.ts";
import { resolveActiveTrack, scopeCatalogue, withTrack } from "./active-track.ts";

const tracks: Track[] = [
  { id: "flutter", slug: "flutter", name: "Flutter" },
  { id: "backend", slug: "backend", name: "Backend" },
  { id: "inactive", slug: "inactive", name: "Inactive" },
];
const topics: Topic[] = [
  { id: "dart", slug: "dart", trackId: "flutter", name: "Dart" },
  { id: "api", slug: "api", trackId: "backend", name: "APIs" },
];
const questions = [
  { id: "flutter-1", slug: "flutter-1", trackId: "flutter", topicIds: ["dart"] },
  { id: "backend-1", slug: "backend-1", trackId: "backend", topicIds: ["api"] },
] as InterviewQuestion[];

test("URL Track takes precedence without changing the Account Default Track", () => {
  const resolution = resolveActiveTrack({
    requestedTrack: "backend",
    tracks,
    activeTrackIds: ["flutter", "backend"],
    preferenceTrackIds: ["flutter", "backend"],
    defaultTrackId: "flutter",
    authenticated: true,
  });

  assert.equal(resolution.activeTrack?.id, "backend");
  assert.deepEqual(resolution.selectableTracks.map(({ id }) => id), ["flutter", "backend"]);
  assert.equal(resolution.invalidTrack, false);
});

test("authenticated choices contain only active Track Preferences", () => {
  const resolution = resolveActiveTrack({
    requestedTrack: null,
    tracks,
    activeTrackIds: ["flutter", "backend"],
    preferenceTrackIds: ["backend", "inactive"],
    defaultTrackId: "inactive",
    authenticated: true,
  });

  assert.deepEqual(resolution.selectableTracks.map(({ id }) => id), ["backend"]);
  assert.equal(resolution.activeTrack?.id, "backend");
});

test("anonymous choices contain all active Tracks and fall back to the first one", () => {
  const resolution = resolveActiveTrack({
    requestedTrack: null,
    tracks,
    activeTrackIds: ["flutter", "backend"],
    preferenceTrackIds: [],
    defaultTrackId: null,
    authenticated: false,
  });

  assert.deepEqual(resolution.selectableTracks.map(({ id }) => id), ["flutter", "backend"]);
  assert.equal(resolution.activeTrack?.id, "flutter");
});

test("invalid explicit Track and cross-Track Topic preserve invalid context", () => {
  const invalidTrack = resolveActiveTrack({
    requestedTrack: "inactive",
    tracks,
    activeTrackIds: ["flutter", "backend"],
    preferenceTrackIds: [],
    defaultTrackId: null,
    authenticated: false,
  });
  assert.equal(invalidTrack.activeTrack, null);
  assert.equal(invalidTrack.invalidTrack, true);

  const scoped = scopeCatalogue("flutter", "api", topics, questions);
  assert.deepEqual(scoped.topics.map(({ id }) => id), ["dart"]);
  assert.deepEqual(scoped.questions.map(({ id }) => id), ["flutter-1"]);
  assert.equal(scoped.invalidTopic, true);
});

test("shareable links preserve Track alongside existing query parameters", () => {
  assert.equal(withTrack("/questions?topic=dart", "flutter"), "/questions?topic=dart&track=flutter");
  assert.equal(withTrack("/session", "flutter"), "/session?track=flutter");
});
