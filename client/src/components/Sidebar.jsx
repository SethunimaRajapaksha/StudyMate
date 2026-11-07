import { NavLink } from "react-router-dom";
import { Compass, Home, LayoutDashboard, Upload } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore Notes", icon: Compass },
  { to: "/upload", label: "Upload Notes", icon: Upload },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-18 flex h-[calc(100vh-4.5rem)] w-60 shrink-0 flex-col bg-brand-900 px-4 py-6">
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                  : "text-soft hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="mt-auto px-4 text-xs text-soft">Learn Together, Succeed Together</p>
    </aside>
  );
}