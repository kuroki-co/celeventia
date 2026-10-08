export type CountdownState =
  | "future"
  | "today"
  | "past";

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  state: CountdownState;
};

type CalendarEventInput = {
  date: string | null | undefined;
  description?: string | null;
  location?: string | null;
  startTime?: string | null;
  summary: string;
  timeZone?: string | null;
};

const timezoneOffsets: Record<string, string> = {
  "America/Lima": "-05:00",
};

export function buildEventStartIso({
  date,
  startTime,
  timeZone,
}: Pick<CalendarEventInput, "date" | "startTime" | "timeZone">) {
  if (!date || !isIsoDate(date)) {
    return null;
  }

  const time = startTime && isTime(startTime) ? startTime : "00:00";
  const offset = timezoneOffsets[timeZone ?? ""] ?? timezoneOffsets["America/Lima"];

  return `${date}T${time}:00${offset}`;
}

export function getCountdownParts(targetIso: string, nowMs = Date.now()): CountdownParts {
  const targetMs = new Date(targetIso).getTime();

  if (!Number.isFinite(targetMs)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      state: "past",
    };
  }

  const diffSeconds = Math.floor((targetMs - nowMs) / 1000);

  if (diffSeconds <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      state: diffSeconds > -24 * 60 * 60 ? "today" : "past",
    };
  }

  return {
    days: Math.floor(diffSeconds / 86400),
    hours: Math.floor((diffSeconds % 86400) / 3600),
    minutes: Math.floor((diffSeconds % 3600) / 60),
    seconds: diffSeconds % 60,
    state: "future",
  };
}

export function buildGoogleCalendarUrl(input: CalendarEventInput) {
  const startIso = buildEventStartIso(input);

  if (!startIso) {
    return null;
  }

  const start = formatUtcCalendarDate(startIso);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    dates: `${start}/${start}`,
    details: input.description ?? "",
    location: input.location ?? "",
    text: input.summary,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsFile(input: CalendarEventInput) {
  const startIso = buildEventStartIso(input);

  if (!startIso) {
    return null;
  }

  const now = formatUtcCalendarDate(new Date().toISOString());
  const uid = `${slugify(input.summary)}-${formatUtcCalendarDate(startIso)}@celeventia`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Celeventia//Invitation//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatUtcCalendarDate(startIso)}`,
    `SUMMARY:${escapeIcsText(input.summary)}`,
    input.location ? `LOCATION:${escapeIcsText(input.location)}` : null,
    input.description ? `DESCRIPTION:${escapeIcsText(input.description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => Boolean(line));

  return foldIcsLines(lines).join("\r\n") + "\r\n";
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function formatUtcCalendarDate(value: string) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLines(lines: string[]) {
  return lines.flatMap((line) => {
    if (line.length <= 75) {
      return line;
    }

    const chunks: string[] = [];
    let current = line;

    while (current.length > 75) {
      chunks.push(chunks.length ? ` ${current.slice(0, 74)}` : current.slice(0, 75));
      current = current.slice(chunks.length === 1 ? 75 : 74);
    }

    chunks.push(chunks.length ? ` ${current}` : current);

    return chunks;
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "invitacion";
}
