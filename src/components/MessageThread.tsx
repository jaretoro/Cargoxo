import Link from "next/link";
import { sendMessageAction } from "@/app/actions/agents";
import { SubmitButton } from "@/components/SubmitButton";
import { STATUS_STYLES, avatarStyle, initials } from "@/lib/ui";

// The exporter and logistics thread pages were near-identical copies, so
// the markup lives here once and each side passes in who it's talking to.

function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: Date;
  senderId: string;
};

export function MessageThread({
  connectionId,
  currentUserId,
  counterpartName,
  counterpartSubtitle,
  status,
  messages,
  backHref,
  olderCount = 0,
  error,
}: {
  connectionId: string;
  currentUserId: string;
  counterpartName: string;
  counterpartSubtitle?: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  messages: ThreadMessage[];
  backHref: string;
  olderCount?: number;
  error?: string | null;
}) {
  // Group consecutive messages by calendar day so a long thread gets date
  // separators instead of a full timestamp stamped under every bubble.
  const groups: { day: string; items: ThreadMessage[] }[] = [];
  for (const message of messages) {
    const day = dayLabel(message.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(message);
    else groups.push({ day, items: [message] });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={backHref} className="text-sm font-medium text-ochre hover:underline">
        ← All messages
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle(counterpartName)}`}>
          {initials(counterpartName)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold text-ink">{counterpartName}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>{status}</span>
          </div>
          {counterpartSubtitle && <p className="truncate text-sm text-muted">{counterpartSubtitle}</p>}
        </div>
      </div>

      {error && <div className="mt-4 bg-bad-tint px-4 py-3 text-sm text-bad">{decodeURIComponent(error)}</div>}

      <div className="mt-6 space-y-4 border border-rule bg-surface p-4">
        {olderCount > 0 && (
          <p className="text-center text-xs text-muted">
            {olderCount} older {olderCount === 1 ? "message" : "messages"} not shown
          </p>
        )}

        {groups.map((group) => (
          <div key={group.day} className="space-y-2">
            <p className="text-center text-xs font-medium text-muted">{group.day}</p>
            {group.items.map((m) => {
              const mine = m.senderId === currentUserId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 text-sm ${mine ? "bg-ink text-paper" : "bg-paper-deep text-ink-soft"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`mt-1 text-right text-xs ${mine ? "text-on-ink" : "text-muted"}`}>
                      {m.createdAt.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {messages.length === 0 && <p className="text-center text-sm text-muted">No messages yet.</p>}
      </div>

      <form action={sendMessageAction} className="mt-4 flex gap-2">
        <input type="hidden" name="connectionId" value={connectionId} />
        <input
          name="body"
          required
          maxLength={2000}
          autoComplete="off"
          placeholder="Type a message…"
          className="flex-1 border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <SubmitButton pendingLabel="Sending…" className="bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-hover">
          Send
        </SubmitButton>
      </form>
    </div>
  );
}
