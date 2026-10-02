import { NavLink } from "react-router-dom";
import { Map, ClipboardList, FlaskConical, BookOpen, Camera, Home, ChevronsLeft, GraduationCap } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

const items = [
  { to: "/", label: "Home", short: "Home", icon: Home },
  { to: "/assess", label: "Assess", short: "Assess", icon: Camera },
  { to: "/map", label: "Map", short: "Map", icon: Map },
  { to: "/review", label: "Review queue", short: "Review", icon: ClipboardList },
  { to: "/learn", label: "Learn", short: "Learn", icon: GraduationCap },
  { to: "/methodology", label: "Methodology", short: "Method", icon: BookOpen }
];

// Phones have room for five tabs; Methodology is linked from the Learn page instead.
const mobileItems = items.filter((i) => i.to !== "/methodology");

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col gap-2 p-4 shrink-0 border-r border-line bg-white transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <FlaskConical className="text-primary" aria-hidden />
            <span className="font-heading text-lg">StreamLens</span>
          </div>
        )}
        <button
          className="btn-secondary p-2"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft size={16} className={clsx(collapsed && "rotate-180")} aria-hidden />
        </button>
      </div>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          aria-label={collapsed ? label : undefined}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm",
              isActive ? "bg-primary-soft text-primary font-medium border border-primary/30" : "text-text-muted hover:text-text"
            )
          }
        >
          <Icon size={18} aria-hidden />
          {!collapsed && <span>{label}</span>}
        </NavLink>
      ))}
    </aside>
  );
}

export function MobileTabs() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line shadow-[0_-1px_3px_rgba(15,23,42,0.06)] flex justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" aria-label="Primary">
      {mobileItems.map(({ to, label, short, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          aria-label={label}
          className={({ isActive }) =>
            clsx("flex flex-col items-center gap-1 text-xs", isActive ? "text-primary font-medium" : "text-text-muted")
          }
        >
          <Icon size={20} aria-hidden />
          {short}
        </NavLink>
      ))}
    </nav>
  );
}