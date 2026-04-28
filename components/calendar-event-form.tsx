import {
  type CalendarEventKind,
  type CalendarEventStatus,
  calendarEventKinds,
  calendarEventStatuses,
} from "@/lib/calendar-contracts";
import {
  getCalendarEventKindLabel,
  getCalendarEventStatusLabel,
} from "@/lib/calendar-utils";

export type CalendarEventFormValues = {
  title: string;
  description: string;
  kind: CalendarEventKind;
  status: CalendarEventStatus;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string;
  noteId: string;
};

type NoteOption = {
  id: string;
  title: string;
};

type CalendarEventFormProps = {
  mode: "create" | "edit";
  values: CalendarEventFormValues;
  notes: NoteOption[];
  isSaving: boolean;
  isDeleting: boolean;
  onChange: (values: CalendarEventFormValues) => void;
  onCancel: () => void;
  onSubmit: () => void;
  onDelete: (() => void) | null;
};

export function CalendarEventForm({
  mode,
  values,
  notes,
  isSaving,
  isDeleting,
  onChange,
  onCancel,
  onSubmit,
  onDelete,
}: CalendarEventFormProps) {
  const fieldClassName =
    "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/15";
  const labelClassName = "block space-y-1.5 text-sm";
  const labelTextClassName = "font-medium text-foreground";

  return (
    <div className="space-y-4">
      <div className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {mode === "edit" ? "Edit event" : "New event"}
        </p>
        <h2 className="text-2xl font-semibold text-foreground">
          {mode === "edit" ? "Update calendar event" : "Add calendar event"}
        </h2>
      </div>

      <label className={labelClassName}>
        <span className={labelTextClassName}>Title</span>
        <input
          type="text"
          value={values.title}
          onChange={(event) =>
            onChange({
              ...values,
              title: event.target.value,
            })
          }
          className={fieldClassName}
          placeholder="Untitled"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClassName}>
          <span className={labelTextClassName}>Type</span>
          <select
            value={values.kind}
            onChange={(event) =>
              onChange({
                ...values,
                kind: event.target.value as CalendarEventKind,
              })
            }
            className={fieldClassName}
          >
            {calendarEventKinds.map((kind) => (
              <option
                key={kind}
                value={kind}
                className="bg-surface text-foreground"
              >
                {getCalendarEventKindLabel(kind)}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>Status</span>
          <select
            value={values.status}
            onChange={(event) =>
              onChange({
                ...values,
                status: event.target.value as CalendarEventStatus,
              })
            }
            className={fieldClassName}
          >
            {calendarEventStatuses.map((status) => (
              <option
                key={status}
                value={status}
                className="bg-surface text-foreground"
              >
                {getCalendarEventStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={values.allDay}
          onChange={(event) =>
            onChange({
              ...values,
              allDay: event.target.checked,
            })
          }
          className="size-4 rounded border-border bg-transparent accent-primary"
        />
        All day
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClassName}>
          <span className={labelTextClassName}>Start</span>
          <input
            type={values.allDay ? "date" : "datetime-local"}
            value={values.startsAt}
            onChange={(event) =>
              onChange({
                ...values,
                startsAt: event.target.value,
              })
            }
            className={fieldClassName}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>End</span>
          <input
            type={values.allDay ? "date" : "datetime-local"}
            value={values.endsAt}
            onChange={(event) =>
              onChange({
                ...values,
                endsAt: event.target.value,
              })
            }
            className={fieldClassName}
          />
        </label>
      </div>

      <label className={labelClassName}>
        <span className={labelTextClassName}>Location</span>
        <input
          type="text"
          value={values.location}
          onChange={(event) =>
            onChange({
              ...values,
              location: event.target.value,
            })
          }
          className={fieldClassName}
          placeholder="Optional"
        />
      </label>

      <label className={labelClassName}>
        <span className={labelTextClassName}>Linked note</span>
        <select
          value={values.noteId}
          onChange={(event) =>
            onChange({
              ...values,
              noteId: event.target.value,
            })
          }
          className={fieldClassName}
        >
          <option value="" className="bg-surface text-foreground">
            None
          </option>
          {notes.map((note) => (
            <option
              key={note.id}
              value={note.id}
              className="bg-surface text-foreground"
            >
              {note.title || "Untitled"}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        <span className={labelTextClassName}>Description</span>
        <textarea
          value={values.description}
          onChange={(event) =>
            onChange({
              ...values,
              description: event.target.value,
            })
          }
          className="min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/15"
          placeholder="Details"
        />
      </label>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
        <div>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting || isSaving}
              className="h-9 rounded-md border border-destructive/30 px-3 text-sm text-destructive transition enabled:hover:bg-destructive/10 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving || isDeleting}
            className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground transition enabled:hover:bg-accent enabled:hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || isDeleting || !values.startsAt}
            className="h-9 rounded-md border border-border bg-primary px-3 text-sm font-medium text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : mode === "edit"
                ? "Save changes"
                : "Create event"}
          </button>
        </div>
      </div>
    </div>
  );
}
