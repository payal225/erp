import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandMark, CloseIcon, SparkIcon } from "./Icons";
import { StatusPill } from "./UI";
import { navigationLinks } from "./navigation";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ME";

const Sidebar = ({ isOpen, onClose = () => {} }) => {
  const { user } = useAuth();

  return (
    <aside className={`shell-sidebar ${isOpen ? "is-open" : ""}`}>
      <div className="shell-sidebar__brand">
        <div className="shell-sidebar__brand-mark">
          <BrandMark size={22} />
        </div>
        <div className="shell-sidebar__brand-copy">
          <strong>Mini ERP</strong>
          <span>Darling Workspace</span>
        </div>
        <button
          type="button"
          className="button button--ghost button--icon shell-sidebar__close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <CloseIcon size={18} />
        </button>
      </div>

      <div className="shell-sidebar__user">
        <div className="avatar-badge">{getInitials(user?.name)}</div>
        <div className="shell-sidebar__user-copy">
          <strong>{user?.name || "Workspace member"}</strong>
          <p>{user?.email || "Signed in"}</p>
        </div>
      </div>

      <div className="shell-sidebar__meta">
        <StatusPill tone={user?.role === "admin" ? "accent" : "secondary"}>
          {user?.role || "member"}
        </StatusPill>
      </div>

      <p className="shell-sidebar__eyebrow">Navigate</p>

      <nav className="nav-list" aria-label="Primary navigation">
        {navigationLinks.map(({ to, label, description, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            data-label={label}
            aria-label={label}
            title={label}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span className="nav-link__icon">
              <Icon size={18} />
            </span>
            <span className="nav-link__copy">
              <strong>{label}</strong>
              <span>{description}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="shell-sidebar__footer">
        <span className="shell-sidebar__footer-icon">
          <SparkIcon size={16} />
        </span>
        <strong>92%</strong>
        <p>Flow</p>
      </div>
    </aside>
  );
};

export default Sidebar;
