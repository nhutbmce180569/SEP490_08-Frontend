import { Bell } from "lucide-react";

export default function NotificationBell() {
  return (
    <button
      type="button"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#EB662B]/10 hover:text-[#EB662B]"
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell className="h-5 w-5" />
      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#EB662B]" />
    </button>
  );
}
