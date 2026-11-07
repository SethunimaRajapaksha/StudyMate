import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import studyMateLogo from "../assets/StudyMate.png";
import NotificationBell from "./NotificationBell";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/explore?q=${encodeURIComponent(term)}` : "/explore");
  };

  const initials = (user?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 flex h-18 items-center gap-6 bg-brand-900 px-6 text-white">
      <Link to="/" className="flex w-52 shrink-0 items-center gap-3">
        <span className="rounded-xl bg-white p-1">
          <img src={studyMateLogo} alt="StudyMate" className="h-9 w-9 object-contain" />
        </span>
        <span className="text-xl font-extrabold">StudyMate</span>
      </Link>

      <form onSubmit={handleSearch} className="relative max-w-xl flex-1">
        <Search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes, course codes or tags..."
          className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pr-4 pl-11 text-sm text-white placeholder:text-soft outline-none focus:border-soft focus:bg-white/15"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-xl p-1.5 pr-3 transition hover:bg-white/10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold">
              {initials}
            </span>
            <span className="hidden text-sm font-semibold md:block">{user?.name}</span>
            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-brand-border bg-white text-brand-900 shadow-xl">
              <div className="border-b border-brand-border px-4 py-3">
                <p className="truncate font-bold">{user?.name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-brand-50"
              >
                <LayoutDashboard size={16} /> My Dashboard
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}