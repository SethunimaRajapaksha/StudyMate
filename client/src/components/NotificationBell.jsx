import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../api/axios";
import { timeAgo } from "../utils/time";
import { NOTIFICATION_ICONS } from "../utils/notificationIcons";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      /* ignore */
    }
  }, []);

  // Load karanawa + hama seconds 60k ta parak refresh karanawa
  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  // Eliyata click karama dropdown eka close wenawa
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggle = () => {
    if (!open) load();
    setOpen(!open);
  };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      try {
        await api.patch(`/notifications/${n._id}/read`);
      } catch {
        /* ignore */
      }
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    navigate(n.link || "/");
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-xl p-2.5 text-white transition hover:bg-white/10"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-brand-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-brand-border bg-white text-brand-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
            <h3 className="font-bold">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs font-semibold text-brand-500 hover:text-brand-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">No notifications yet</p>
            ) : (
              items.map((n) => {
                const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                return (
                  <button
                    key={n._id}
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-brand-50 ${
                      n.read ? "" : "bg-brand-50/60"
                    }`}
                  >
                    <span className="mt-0.5 rounded-lg bg-brand-50 p-2 text-brand-500">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.read ? "text-muted" : "font-semibold"}`}>
                        {n.message}
                      </span>
                      <span className="text-xs text-muted">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}