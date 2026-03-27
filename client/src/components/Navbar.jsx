import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoutIcon, MenuIcon, MoonIcon, SunIcon } from "./Icons";
import { StatusPill } from "./UI";
import { navigationLinks, routeMeta } from "./navigation";

const Navbar = ({ onOpenSidebar = () => {} }) => {
  const { user, logout, dark, toggleDark } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const meta = routeMeta[location.pathname] || routeMeta["/dashboard"];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar__inner fade-up">
        <div className="topbar__copy">
          <button
            type="button"
            className="button button--ghost button--icon topbar__toggle"
            onClick={onOpenSidebar}
            aria-label="Open navigation"
          >
            <MenuIcon size={18} />
          </button>

          <div className="topbar__label">
            <p className="topbar__eyebrow">Workspace</p>
            <strong>{meta.title}</strong>
            <span>{meta.description}</span>
          </div>
        </div>

        <nav className="topbar__nav" aria-label="Quick navigation">
          {navigationLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `topbar__nav-link ${isActive ? "active" : ""}`}
              aria-label={label}
              title={label}
            >
              <Icon size={18} />
            </NavLink>
          ))}
        </nav>

        <div className="topbar__actions">
          <StatusPill tone="neutral" className="topbar__meta-pill">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </StatusPill>
          <StatusPill
            tone={user?.role === "admin" ? "accent" : "secondary"}
            className="topbar__meta-pill"
          >
            {user?.role || "member"}
          </StatusPill>
          <button
            type="button"
            className="button button--ghost button--icon"
            onClick={toggleDark}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            title={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
          <button
            type="button"
            className="button button--ghost button--icon"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogoutIcon size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
