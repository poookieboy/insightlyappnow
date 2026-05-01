// Local browser notifications for tasks and timetable.
import type { Task, TimetableEntry } from "./store";

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function notify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {
    /* ignore */
  }
}

const fired = new Set<string>();

export function scheduleChecks(tasks: Task[], timetable: TimetableEntry[]) {
  if (typeof window === "undefined") return () => {};

  const tick = () => {
    const now = new Date();

    // Task deadlines: notify 1 hour before
    tasks.forEach((t) => {
      if (t.completed) return;
      const dl = new Date(t.deadline).getTime();
      const diff = dl - now.getTime();
      const key = `task-${t.id}`;
      if (diff > 0 && diff < 60 * 60 * 1000 && !fired.has(key)) {
        fired.add(key);
        notify("Insightly", `Hey 👀 don't forget: ${t.title}`);
      }
    });

    // Timetable: notify 1 hour before today's class
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
    const today = days[now.getDay()];
    timetable.forEach((entry) => {
      if (entry.day !== today) return;
      const [h, m] = entry.time.split(":").map(Number);
      const classTime = new Date(now);
      classTime.setHours(h, m, 0, 0);
      const diff = classTime.getTime() - now.getTime();
      const key = `tt-${entry.id}-${now.toDateString()}`;
      if (diff > 0 && diff < 60 * 60 * 1000 && !fired.has(key)) {
        fired.add(key);
        notify("Insightly", `${entry.subject} class in 1 hour`);
      }
    });
  };

  tick();
  const id = window.setInterval(tick, 60 * 1000);
  return () => window.clearInterval(id);
}
