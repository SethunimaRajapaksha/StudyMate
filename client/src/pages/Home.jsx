import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  Compass,
  Download,
  FileText,
  LayoutDashboard,
  Search,
  Star,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import NoteCard from "../components/NoteCard";
import { formatDate, timeAgo } from "../utils/time";
import { NOTIFICATION_ICONS } from "../utils/notificationIcons";

const card = "rounded-2xl border border-brand-border bg-white p-5 shadow-sm shadow-brand-900/5";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function NotesSection({ title, params, emptyText }) {
  const { data, loading, error } = useFetch("/notes", params);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-brand-900">{title}</h2>
        <Link to="/explore" className="text-sm font-semibold text-brand-500 hover:text-brand-700">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : data.length === 0 ? (
        <div className={`${card} text-center text-sm text-muted`}>{emptyText}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((note) => (
            <NoteCard key={note._id} note={note} />
          ))}
        </div>
      )}
    </section>
  );
}

function StatsPanel() {
  const { data, loading } = useFetch("/users/me/stats");

  const items = [
    { label: "Notes uploaded", value: data?.uploadsCount ?? 0, icon: FileText },
    { label: "Total downloads", value: data?.totalDownloads ?? 0, icon: Download },
    { label: "Avg. rating", value: (data?.overallAverageRating ?? 0).toFixed(1), icon: Star },
    { label: "Reputation", value: data?.user?.reputationPoints ?? 0, icon: Award },
  ];

  return (
    <div className={card}>
      <h3 className="font-extrabold text-brand-900">Your contribution</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-brand-50 p-3">
            <Icon size={18} className="text-brand-500" />
            <p className="mt-2 text-2xl font-extrabold text-brand-900">{loading ? "–" : value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityPanel() {
  const { data, loading } = useFetch("/notifications");
  const items = (data?.notifications || []).slice(0, 5);

  return (
    <div className={card}>
      <h3 className="font-extrabold text-brand-900">Recent activity</h3>
      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">No activity yet. Upload a note to get started.</p>
        ) : (
          items.map((n) => {
            const Icon = NOTIFICATION_ICONS[n.type] || Bell;
            return (
              <Link key={n._id} to={n.link || "/"} className="flex items-start gap-3">
                <span className="rounded-lg bg-brand-50 p-2 text-brand-500">
                  <Icon size={14} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-brand-900">{n.message}</span>
                  <span className="text-xs text-muted">{timeAgo(n.createdAt)}</span>
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function RequestsPanel() {
  const { data, loading } = useFetch("/requests/incoming");
  const pending = (data || []).filter((r) => r.status === "Pending").slice(0, 3);

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-brand-900">Requests for you</h3>
        <Link to="/dashboard" className="text-sm font-semibold text-brand-500 hover:text-brand-700">
          View all
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted">No pending requests.</p>
        ) : (
          pending.map((r) => (
            <div key={r._id} className="rounded-xl border border-brand-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-brand-700">{r.targetCourseCode}</span>
                {r.isOverdue ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                    Overdue
                  </span>
                ) : r.isUrgent ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    Urgent
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-brand-900">{r.topicDescription}</p>
              <p className="mt-1 text-xs text-muted">
                From {r.requesterId?.name || "a student"} · Needed by {formatDate(r.deadline)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const firstName = user?.name?.split(" ")[0] || "there";

  const handleSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/explore?q=${encodeURIComponent(term)}` : "/explore");
  };

  const actions = [
    { to: "/explore", label: "Explore Notes", text: "Find notes by course or tag", icon: Compass },
    { to: "/upload", label: "Upload Notes", text: "Share a PDF with your batch", icon: Upload },
    { to: "/dashboard", label: "My Dashboard", text: "Track uploads and requests", icon: LayoutDashboard },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div className="min-w-0 space-y-8">
        <section className="rounded-3xl bg-linear-to-r from-brand-900 via-brand-700 to-brand-500 p-8 text-white">
          <h1 className="text-3xl font-extrabold">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="mt-2 text-soft">What are you studying today?</p>

          <form onSubmit={handleSearch} className="mt-6 flex max-w-2xl gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, course code (e.g. IN24-S2-IT1207) or tag"
                className="w-full rounded-xl bg-white py-3 pr-4 pl-11 text-sm text-brand-900 outline-none placeholder:text-muted"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-gold px-6 text-sm font-bold text-brand-900 transition hover:brightness-95"
            >
              Search
            </button>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {actions.map(({ to, label, text, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 rounded-2xl border border-brand-border bg-white p-5 shadow-sm shadow-brand-900/5 transition hover:-translate-y-0.5 hover:border-brand-500"
            >
              <span className="rounded-xl bg-brand-50 p-3 text-brand-500">
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-bold text-brand-900">{label}</span>
                <span className="text-xs text-muted">{text}</span>
              </span>
            </Link>
          ))}
        </section>

        <NotesSection
          title="Popular notes"
          params={{ sort: "popular", limit: 6 }}
          emptyText="No notes yet. Be the first to upload one!"
        />
        <NotesSection
          title="Recently uploaded"
          params={{ limit: 6 }}
          emptyText="No notes yet. Be the first to upload one!"
        />
      </div>

      {/* Right panel */}
      <aside className="space-y-6">
        <StatsPanel />
        <RequestsPanel />
        <ActivityPanel />
      </aside>
    </div>
  );
}