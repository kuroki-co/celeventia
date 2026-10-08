import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEventStartIso,
  buildGoogleCalendarUrl,
  buildIcsFile,
  getCountdownParts,
} from "./calendar";

test("buildEventStartIso uses the structured date, time and Lima offset", () => {
  assert.equal(
    buildEventStartIso({
      date: "2027-01-15",
      startTime: "19:30",
      timeZone: "America/Lima",
    }),
    "2027-01-15T19:30:00-05:00",
  );
});

test("buildEventStartIso falls back to local day start when time is absent", () => {
  assert.equal(
    buildEventStartIso({
      date: "2027-01-15",
      startTime: null,
      timeZone: "America/Lima",
    }),
    "2027-01-15T00:00:00-05:00",
  );
});

test("buildEventStartIso rejects invalid date values", () => {
  assert.equal(
    buildEventStartIso({
      date: "15/01/2027",
      startTime: "19:30",
      timeZone: "America/Lima",
    }),
    null,
  );
});

test("getCountdownParts returns full future units", () => {
  const now = new Date("2027-01-01T00:00:00-05:00").getTime();
  const target = "2027-01-03T02:03:04-05:00";

  assert.deepEqual(getCountdownParts(target, now), {
    days: 2,
    hours: 2,
    minutes: 3,
    seconds: 4,
    state: "future",
  });
});

test("getCountdownParts distinguishes wedding day from past events", () => {
  const target = "2027-01-01T18:00:00-05:00";

  assert.equal(
    getCountdownParts(target, new Date("2027-01-01T18:00:01-05:00").getTime())
      .state,
    "today",
  );
  assert.equal(
    getCountdownParts(target, new Date("2027-01-03T18:00:01-05:00").getTime())
      .state,
    "past",
  );
});

test("buildIcsFile escapes text and uses CRLF line endings", () => {
  const ics = buildIcsFile({
    date: "2027-01-15",
    description: "Ceremonia, cena; baile\nTraer alegria",
    location: "Lima, Peru; Salon",
    startTime: "19:30",
    summary: "Ana & Luis",
    timeZone: "America/Lima",
  });

  assert.ok(ics);
  assert.match(ics, /DTSTART:20270116T003000Z/);
  assert.match(ics, /SUMMARY:Ana & Luis/);
  assert.match(ics, /LOCATION:Lima\\, Peru\\; Salon/);
  assert.match(ics, /DESCRIPTION:Ceremonia\\, cena\\; baile\\nTraer alegria/);
  assert.ok(ics.endsWith("\r\n"));
  assert.equal(/(?<!\r)\n/.test(ics), false);
});

test("buildIcsFile folds long content lines", () => {
  const ics = buildIcsFile({
    date: "2027-01-15",
    description:
      "Mensaje largo para validar que las lineas del archivo de calendario se pliegan sin romper el formato ICS esperado por clientes de calendario.",
    startTime: "19:30",
    summary: "Ana & Luis",
    timeZone: "America/Lima",
  });

  assert.ok(ics);
  assert.ok(ics.split("\r\n").some((line) => line.startsWith(" ")));
  assert.ok(
    ics
      .split("\r\n")
      .filter(Boolean)
      .every((line) => line.length <= 75),
  );
});

test("buildGoogleCalendarUrl uses the same UTC start value and encoded fields", () => {
  const url = buildGoogleCalendarUrl({
    date: "2027-01-15",
    description: "Ceremonia y fiesta",
    location: "Lima, Peru",
    startTime: "19:30",
    summary: "Ana & Luis",
    timeZone: "America/Lima",
  });

  assert.ok(url);

  const parsed = new URL(url);

  assert.equal(parsed.origin, "https://calendar.google.com");
  assert.equal(parsed.searchParams.get("dates"), "20270116T003000Z/20270116T003000Z");
  assert.equal(parsed.searchParams.get("text"), "Ana & Luis");
  assert.equal(parsed.searchParams.get("location"), "Lima, Peru");
});
