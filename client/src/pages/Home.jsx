import { Link, Navigate } from "react-router-dom";
import "../styles/home.css";
import {
  AttendanceIcon,
  BrandMark,
  MoneyIcon,
  SparkIcon,
  TasksIcon,
  UsersIcon,
} from "../components/Icons";
import { StatusPill } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const spotlightItems = [
  {
    icon: UsersIcon,
    label: "People",
    value: "24",
  },
  {
    icon: AttendanceIcon,
    label: "Today",
    value: "91%",
  },
  {
    icon: TasksIcon,
    label: "Tasks",
    value: "18",
  },
  {
    icon: MoneyIcon,
    label: "Payroll",
    value: "Ready",
  },
];

const Home = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="public-home">
      <section className="panel public-home__hero fade-up">
        <div className="public-home__content">
          <div className="public-home__brand">
            <div className="shell-sidebar__brand-mark">
              <BrandMark size={22} />
            </div>
            <div>
              <strong>Mini ERP</strong>
              <span>Darling Workspace</span>
            </div>
          </div>

          <StatusPill tone="neutral" className="public-home__pill">
            <SparkIcon size={14} />
            Premium flow
          </StatusPill>

          <div className="public-home__copy">
            <p className="eyebrow">People Ops</p>
            <h1>Soft tones. Sharp control.</h1>
            <p>
              Manage attendance, leave, tasks, and payroll inside a calm workspace with
              premium rhythm and zero visual clutter.
            </p>
          </div>

          <div className="public-home__actions">
            <Link className="button button--primary" to="/login">
              Sign in
            </Link>
            <Link className="button button--ghost" to="/login?mode=signup">
              Create account
            </Link>
          </div>

          <div className="public-home__mini-grid">
            {spotlightItems.map(({ icon: Icon, label, value }) => (
              <div className="public-home__mini-card" key={label}>
                <span className="public-home__mini-icon">
                  <Icon size={16} />
                </span>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="public-home__preview">
          <div className="public-home__preview-card">
            <div className="public-home__preview-head">
              <div>
                <p className="eyebrow">Overview</p>
                <h2>Everything in one gentle grid.</h2>
              </div>
              <StatusPill tone="accent">Live</StatusPill>
            </div>

            <div className="public-home__preview-metrics">
              <div>
                <span>Present</span>
                <strong>21</strong>
              </div>
              <div>
                <span>Pending</span>
                <strong>08</strong>
              </div>
            </div>

            <div className="public-home__preview-list">
              <div className="public-home__preview-row">
                <span>Attendance pulse</span>
                <strong>Healthy</strong>
              </div>
              <div className="public-home__preview-row">
                <span>Leave approvals</span>
                <strong>3 waiting</strong>
              </div>
              <div className="public-home__preview-row">
                <span>Payroll cycle</span>
                <strong>Ready to run</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
