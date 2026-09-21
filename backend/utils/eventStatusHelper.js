const Event = require('../models/Event');

// IST offset in minutes: UTC+5:30 = 330 minutes
const IST_OFFSET_MS = 330 * 60 * 1000;

/**
 * Parses an event's date + time string into a UTC Date, using IST (Asia/Kolkata)
 * as the reference timezone — regardless of the server's OS locale.
 *
 * Why this matters:
 *   MongoDB stores event.date as UTC midnight (e.g. July 18 IST = 2026-07-17T18:30:00Z).
 *   The old setHours() call applied hours in server-local time, not IST.
 *   This function uses explicit UTC arithmetic with a fixed +5:30 offset.
 *
 * @param {Date} baseDate  - The event's date field from MongoDB (UTC)
 * @param {string} timeStr - The time string, e.g. "11:00 AM" or "02:30 PM"
 * @returns {Date}         - UTC Date representing that exact IST datetime
 */
const parseDateTime = (baseDate, timeStr) => {
  if (!baseDate) return null;

  // Step 1: Shift UTC timestamp into IST to read the correct calendar date
  // MongoDB stores event.date as UTC (e.g. July 18 IST = 2026-07-17T18:30:00Z)
  const utcMs = new Date(baseDate).getTime();
  const istMs = utcMs + IST_OFFSET_MS;
  const istDate = new Date(istMs);

  const year  = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();   // 0-indexed
  const day   = istDate.getUTCDate();

  // Step 2: Parse the time string.
  // Supports both formats:
  //   "11:00 AM" / "02:30 PM"  (12-hour — used by seed data / display)
  //   "11:00" / "14:00"        (24-hour — used by admin form's <input type="time">)
  if (!timeStr) return null; // caller will use a safe fallback or skip

  const cleanTime = timeStr.trim();
  const parts     = cleanTime.split(/\s+/);
  const timePart  = parts[0] || '0:00';
  const modifier  = (parts[1] || '').toUpperCase(); // 'AM', 'PM', or '' for 24h

  const timeSplit = timePart.split(':');
  let hours   = Number(timeSplit[0]) || 0;
  let minutes = Number(timeSplit[1]) || 0;

  // 12-hour → 24-hour conversion (only applies when AM/PM is present)
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  // If no modifier: treat as 24-hour already (e.g. "14:00" stays as-is)

  // Step 3: Subtract IST offset (+5h30m) to get UTC
  //   IST 11:00 → UTC 05:30  (subtract 5h30m)
  //   IST 00:30 → UTC 19:00 prev day (handled via underflow below)
  let utcHours   = hours   - 5;
  let utcMinutes = minutes - 30;

  // Handle minute underflow (e.g. 0 - 30 = -30 → borrow 1 hour)
  if (utcMinutes < 0) {
    utcMinutes += 60;
    utcHours   -= 1;
  }
  // Handle hour underflow (rolls back to previous UTC day)
  let utcDay   = day;
  let utcMonth = month;
  let utcYear  = year;
  if (utcHours < 0) {
    utcHours += 24;
    const prevDay = new Date(Date.UTC(year, month, day - 1));
    utcYear  = prevDay.getUTCFullYear();
    utcMonth = prevDay.getUTCMonth();
    utcDay   = prevDay.getUTCDate();
  }

  return new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHours, utcMinutes, 0, 0));
};


/**
 * Scans all events in the DB and updates their status field based on
 * the current IST time vs the event's computed startDateTime / endDateTime.
 *
 * Status transitions:
 *   now < startDateTime              → 'upcoming'
 *   startDateTime <= now < endDateTime → 'ongoing'
 *   now >= endDateTime               → 'completed'
 *
 * Registration is auto-closed when an event starts or completes.
 * This is called on every GET /api/events request AND by a 60s setInterval on server startup.
 */
const updateEventStatuses = async () => {
  try {
    const events = await Event.find({});
    const now = new Date(); // UTC "now"

    for (const event of events) {
      if (!event.date) continue;

      // Parse start/end datetimes using IST-correct UTC arithmetic.
      // parseDateTime returns null when timeStr is missing.
      let startDateTime = parseDateTime(event.date, event.startTime);
      let endDateTime   = parseDateTime(event.date, event.endTime);

      // Fallback for events that have no time fields (legacy seed data):
      // Use start-of-IST-day for startTime and end-of-IST-day (23:59 IST) for endTime
      if (!startDateTime || !endDateTime) {
        const IST_OFFSET_MS_LOCAL = 330 * 60 * 1000;
        const istMs   = new Date(event.date).getTime() + IST_OFFSET_MS_LOCAL;
        const istDate = new Date(istMs);
        const y = istDate.getUTCFullYear();
        const m = istDate.getUTCMonth();
        const d = istDate.getUTCDate();
        // IST 00:00 = UTC (prev day 18:30)
        startDateTime = new Date(Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET_MS_LOCAL);
        // IST 23:59 = UTC 18:29 same calendar day
        endDateTime   = new Date(Date.UTC(y, m, d, 18, 29, 0));
      }

      let calculatedStatus = 'upcoming';

      if (now >= endDateTime) {
        calculatedStatus = 'completed';
      } else if (now >= startDateTime && now < endDateTime) {
        calculatedStatus = 'ongoing';
      }

      // Only write to DB if status actually changed (avoid unnecessary writes)
      if (event.status !== calculatedStatus) {
        const updatePayload = { status: calculatedStatus };

        // Auto-close registration once event starts or ends
        if (calculatedStatus === 'ongoing' || calculatedStatus === 'completed') {
          updatePayload.registrationOpen = false;
        }

        await Event.findByIdAndUpdate(event._id, updatePayload);

        console.log(
          `[EventStatus] "${event.title}" → ${event.status} → ${calculatedStatus}` +
          ` | endDateTime(UTC): ${endDateTime.toISOString()} | now(UTC): ${now.toISOString()}`
        );
      }
    }
  } catch (error) {
    console.error('[EventStatus] Error updating event statuses:', error);
  }
};

module.exports = {
  updateEventStatuses,
  parseDateTime,
};
