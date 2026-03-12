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
      <div className="grid grid-cols-7 border-b border-white/10 px-3 py-2">
        {weekdayLabels.map((label) => (
          <p
            key={label}
            className="px-2 text-center text-xs uppercase tracking-[0.16em] text-muted"
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
              className={`flex min-h-[120px] flex-col gap-1 border-b border-r border-white/10 p-2 text-left transition ${
                isSelected ? "bg-white/10" : "hover:bg-white/5"
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
                      ? "bg-accent text-black"
                      : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted"
                  }`}
                >
                  {day.getDate()}
                </span>
              </button>
              <div className="space-y-1">
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
                  <p className="px-2 text-[11px] text-muted">
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
