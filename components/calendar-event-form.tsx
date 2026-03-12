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
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          {mode === "edit" ? "Edit item" : "New item"}
        </p>
        <h2 className="text-xl font-semibold text-foreground">
          {mode === "edit" ? "Update calendar item" : "Add calendar item"}
        </h2>
      </div>

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">
          Title
        </span>
        <input
          type="text"
          value={values.title}
          onChange={(event) =>
            onChange({
              ...values,
              title: event.target.value,
            })
          }
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30"
          placeholder="Untitled"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Type
          </span>
          <select
            value={values.kind}
            onChange={(event) =>
              onChange({
                ...values,
                kind: event.target.value as CalendarEventKind,
              })
            }
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30"
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

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Status
          </span>
          <select
            value={values.status}
            onChange={(event) =>
              onChange({
                ...values,
                status: event.target.value as CalendarEventStatus,
              })
            }
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30"
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

      <label className="inline-flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={values.allDay}
          onChange={(event) =>
            onChange({
              ...values,
              allDay: event.target.checked,
            })
          }
          className="h-4 w-4 rounded border-white/20 bg-transparent"
        />
        All day
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Start
          </span>
          <input
            type={values.allDay ? "date" : "datetime-local"}
            value={values.startsAt}
            onChange={(event) =>
              onChange({
                ...values,
                startsAt: event.target.value,
              })
            }
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            End
          </span>
          <input
            type={values.allDay ? "date" : "datetime-local"}
            value={values.endsAt}
            onChange={(event) =>
              onChange({
                ...values,
                endsAt: event.target.value,
              })
            }
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">
          Location
        </span>
        <input
          type="text"
          value={values.location}
          onChange={(event) =>
            onChange({
              ...values,
              location: event.target.value,
            })
          }
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30"
          placeholder="Optional"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">
          Linked note
        </span>
        <select
          value={values.noteId}
          onChange={(event) =>
            onChange({
              ...values,
              noteId: event.target.value,
            })
          }
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30"
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

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">
          Description
        </span>
        <textarea
          value={values.description}
          onChange={(event) =>
            onChange({
              ...values,
              description: event.target.value,
            })
          }
          className="min-h-28 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-white/30"
          placeholder="Details"
        />
      </label>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting || isSaving}
              className="rounded-xl border border-rose-300/30 px-3 py-2 text-sm text-rose-200 transition enabled:hover:bg-rose-400/15 disabled:opacity-50"
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
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-muted transition enabled:hover:bg-white/10 enabled:hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || isDeleting || !values.startsAt}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-foreground transition enabled:hover:bg-white/20 disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : mode === "edit"
                ? "Save changes"
                : "Create item"}
          </button>
        </div>
      </div>
    </div>
  );
}
