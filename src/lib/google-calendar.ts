import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim()?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim() || "primary";

  if (!clientEmail || !privateKey) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return { auth, calendarId };
}

export function isCalendarConfigured() {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
    process.env.GOOGLE_PRIVATE_KEY?.trim() &&
    process.env.GOOGLE_CALENDAR_ID?.trim()
  );
}

export async function getAvailableSlots(
  startDate: string,
  endDate: string,
  durationMinutes = 30
): Promise<{ start: string; end: string }[]> {
  const config = getAuth();
  if (!config) return [];

  const calendar = google.calendar({ version: "v3", auth: config.auth });
  const calendarId = config.calendarId;

  const { data: busy } = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate,
      timeMax: endDate,
      items: [{ id: calendarId }],
    },
  });

  const busyRanges =
    busy.calendars?.[calendarId]?.busy?.map((b) => ({
      start: new Date(b.start!).getTime(),
      end: new Date(b.end!).getTime(),
    })) ?? [];

  const slots: { start: string; end: string }[] = [];
  const slotDuration = durationMinutes * 60 * 1000;
  const dayStart = 9 * 60; // 9 AM in minutes
  const dayEnd = 17 * 60; // 5 PM in minutes
  const slotInterval = 30; // 30 min slots

  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    for (let mins = dayStart; mins < dayEnd; mins += slotInterval) {
      const slotStart = new Date(current);
      slotStart.setHours(0, 0, 0, 0);
      slotStart.setMinutes(mins, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + slotDuration);

      if (slotEnd > end) break;

      const slotStartTime = slotStart.getTime();
      const slotEndTime = slotEnd.getTime();

      const isBusy = busyRanges.some(
        (b) =>
          (slotStartTime >= b.start && slotStartTime < b.end) ||
          (slotEndTime > b.start && slotEndTime <= b.end) ||
          (slotStartTime <= b.start && slotEndTime >= b.end)
      );

      if (!isBusy && slotStart > new Date()) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }

    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return slots.slice(0, 20);
}

export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendeeEmail?: string;
  createMeetLink?: boolean;
}): Promise<{ meetLink?: string; eventLink?: string; error?: string }> {
  const config = getAuth();
  if (!config) {
    return { error: "Google Calendar not configured" };
  }

  const calendar = google.calendar({ version: "v3", auth: config.auth });

  const event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees?: { email: string }[];
    conferenceData?: {
      createRequest: {
        requestId: string;
        conferenceSolutionKey: { type: string };
      };
    };
  } = {
    summary: params.summary,
    description: params.description,
    start: {
      dateTime: params.start,
      timeZone: "America/New_York",
    },
    end: {
      dateTime: params.end,
      timeZone: "America/New_York",
    },
  };

  if (params.attendeeEmail) {
    event.attendees = [{ email: params.attendeeEmail }];
  }

  if (params.createMeetLink) {
    event.conferenceData = {
      createRequest: {
        requestId: `mtp-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  try {
    const { data } = await calendar.events.insert({
      calendarId: config.calendarId,
      requestBody: event,
      conferenceDataVersion: params.createMeetLink ? 1 : 0,
    });

    const meetUri = data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri;
    const meetLink = typeof meetUri === "string" ? meetUri : undefined;
    const eventLink = typeof data.htmlLink === "string" ? data.htmlLink : undefined;

    return { meetLink, eventLink };
  } catch (err) {
    console.error("Calendar event create error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to create event",
    };
  }
}
