import { useMemo } from "react";
import type { CalendarEventDto } from "@/lib/calendar-contracts";
import {
  formatEventTimeLabel,
  getCalendarEventKindClass,
  getMonthGridDays,
  toCalendarDayKey,
} from "@/lib/calendar-utils";

type CalendarMonthGridProps = {
  month: Date;
  selectedDate: Date;
  events: CalendarEventDto[];
  onSelectDate: (date: Date) => void;
  onSelectEvent: (eventId: string) => void;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarMonthGrid({
  month,
  selectedDate,
  events,
  onSelectDate,
  onSelectEvent,
}: CalendarMonthGridProps) {
  const days = useMemo(() => getMonthGridDays(month), [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventDto[]>();

    for (const event of events) {
      const key = toCalendarDayKey(new Date(event.startsAt));
      const existing = map.get(key);

      if (existing) {
        existing.push(event);
      } else {
        map.set(key, [event]);
      }
    }

    for (const dayEvents of map.values()) {
      dayEvents.sort(
        (left, right) =>
          new Date(left.startsAt).getTime() -
          new Date(right.startsAt).getTime(),
      );
    }

    return map;
  }, [events]);

  const todayKey = toCalendarDayKey(new Date());
  const selectedKey = toCalendarDayKey(selectedDate);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-7 border-b border-border px-2 py-2 sm:px-3">
        {weekdayLabels.map((label) => (
          <p
            key={label}
            className="px-1 text-center text-xs font-medium uppercase text-muted-foreground sm:px-2"
          >
            {label}
          </p>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const dayKey = toCalendarDayKey(day);
          const dayEvents = eventsByDay.get(dayKey) ?? [];
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isToday = dayKey === todayKey;
          const isSelected = dayKey === selectedKey;

          return (
            <div
              key={dayKey}
              className={`flex min-h-[88px] flex-col gap-1 border-b border-r border-border p-1.5 text-left transition sm:min-h-[112px] sm:p-2 ${
                isSelected ? "bg-accent" : "hover:bg-accent"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDate(day)}
                className="w-fit"
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
              </button>
              <div className="min-w-0 space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      onSelectDate(day);
                      onSelectEvent(event.id);
                    }}
                    className={`block w-full truncate rounded-md border px-2 py-1 text-[11px] leading-tight ${getCalendarEventKindClass(
                      event.kind,
                    )}`}
                  >
                    <span className="mr-1 opacity-80">
                      {formatEventTimeLabel(event.startsAt, event.allDay)}
                    </span>
                    <span className="font-medium">{event.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 ? (
                  <p className="px-2 text-[11px] text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
