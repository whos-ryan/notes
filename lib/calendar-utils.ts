import type {
  CalendarEventKind,
  CalendarEventStatus,
} from "@/lib/calendar-contracts";

export function toCalendarDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function getMonthGridDays(month: Date): Date[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - mondayOffset);

  const days: Date[] = [];

  for (let index = 0; index < 42; index += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    days.push(day);
  }

  return days;
}

export function getMonthGridRange(month: Date): { start: Date; end: Date } {
  const days = getMonthGridDays(month);

  return {
    start: startOfDay(days[0]),
    end: endOfDay(days[days.length - 1]),
  };
}

export function formatMonthLabel(month: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(month);
}

export function formatSelectedDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatEventTimeLabel(
  startsAtIso: string,
  allDay: boolean,
): string {
  if (allDay) {
    return "All day";
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(startsAtIso));
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateTimeInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function getCalendarEventKindLabel(kind: CalendarEventKind): string {
  if (kind === "meeting") {
    return "Meeting";
  }

  if (kind === "deadline") {
    return "Deadline";
  }

  if (kind === "reminder") {
    return "Reminder";
  }

  return "Event";
}

export function getCalendarEventStatusLabel(
  status: CalendarEventStatus,
): string {
  if (status === "in_progress") {
    return "In progress";
  }

  if (status === "done") {
    return "Done";
  }

  if (status === "canceled") {
    return "Canceled";
  }

  return "To do";
}

export function getCalendarEventKindClass(kind: CalendarEventKind): string {
  if (kind === "meeting") {
    return "border-blue-300/30 bg-blue-400/15 text-blue-100";
  }

  if (kind === "deadline") {
    return "border-rose-300/30 bg-rose-400/15 text-rose-100";
  }

  if (kind === "reminder") {
    return "border-amber-300/30 bg-amber-400/15 text-amber-100";
  }

  return "border-emerald-300/30 bg-emerald-400/15 text-emerald-100";
}
