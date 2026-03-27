import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/login.css";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import {
  AttendanceIcon,
  BrandMark,
  MoneyIcon,
  SparkIcon,
  TasksIcon,
  UsersIcon,
} from "../components/Icons";
import { StatusPill } from "../components/UI";

const emptyLoginForm = {
  email: "",
  password: "",
};

const emptySignupForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const loginHighlights = [
  {
    icon: UsersIcon,
    title: "People records",
    
  },
  {
    icon: AttendanceIcon,
    title: "Daily rhythm",

  },
  {
    icon: TasksIcon,
    title: "Focused work",
   
  },
];

const loginStats = [
  {
    label: "Attendance",
    value: "91%",
  },
  {
    label: "Open tasks",
    value: "08",
  },
  {
    label: "Payroll",
    value: "Ready",
  },
];

const demoAccounts = [
  {
    role: "Admin",
    email: "admin@erp.com",
    password: "admin123",
  },
  {
    role: "Employee",
    email: "rahul@erp.com",
    password: "employee123",
  },
];

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(searchParams.get("mode") === "signup" ? "signup" : "login");
  }, [searchParams]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSearchParams(nextMode === "signup" ? { mode: "signup" } : {});
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", loginForm);
      login(response.data.user, response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/signup", {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
      });

      login(response.data.user, response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero fade-up">
        <div className="login-hero__mini">
          <div className="shell-sidebar__brand-mark" style={{ width: "3rem", height: "3rem" }}>
            <BrandMark size={22} />
          </div>
          <StatusPill tone="neutral">
            <SparkIcon size={14} />
            Mini ERP
          </StatusPill>
        </div>

        <div className="login-hero__intro">
          <h1>Premium control for everyday operations.</h1>
        </div>

        <div className="login-hero__grid">
          {loginStats.map(({ label, value }) => (
            <div className="login-hero__stat" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <ul className="login-highlights">
          {loginHighlights.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="login-highlights__icon">
                <Icon size={16} />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="hero-credentials">
          <div className="credential-card">
            <strong>Calm layout</strong>
            <p>Soft gradients, clear spacing, and fast daily navigation.</p>
          </div>
          <div className="credential-card">
            <strong>Single workspace</strong>
            <p>
              People, requests, work, and payroll stay inside one connected flow.
            </p>
          </div>
        </div>
      </section>

      <div className="login-card-shell">
        <section className="panel login-card fade-up">
          <div className="login-card__header">
            <p className="eyebrow">Access</p>
            <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
            <p>
              {mode === "login"
                ? "Use your account to continue."
                : "New accounts are created as employee accounts."}
            </p>
          </div>

          <div className="auth-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={`auth-switch__button ${mode === "login" ? "is-active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth-switch__button ${mode === "signup" ? "is-active" : ""}`}
              onClick={() => switchMode("signup")}
            >
              Sign up
            </button>
          </div>

          {error ? <div className="alert alert--danger">{error}</div> : null}

          {mode === "login" ? (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, email: event.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, password: event.target.value })
                  }
                  required
                />
              </div>

              <div className="login-form__footer">
                <button
                  type="submit"
                  className="button button--primary button--block"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
                <div className="login-note">
                  Built for light daily use with premium spacing and icon-led navigation.
                </div>
              </div>

              <div className="login-note">
                <strong>Demo accounts</strong>
                <p>
                  Admin: <code>admin@erp.com</code> / <code>admin123</code>
                </p>
                <p>
                  Employee: <code>rahul@erp.com</code> / <code>employee123</code>
                </p>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleSignup}>
              <div className="form-field">
                <label htmlFor="signup-name">Name</label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={signupForm.name}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, name: event.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={signupForm.email}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, email: event.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={signupForm.password}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, password: event.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="signup-confirm">Confirm password</label>
                <input
                  id="signup-confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={signupForm.confirmPassword}
                  onChange={(event) =>
                    setSignupForm({
                      ...signupForm,
                      confirmPassword: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="login-form__footer">
                <button
                  type="submit"
                  className="button button--primary button--block"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
                <div className="login-note">
                  New users start with employee access and can enter the workspace right away.
                </div>
              </div>
            </form>
          )}

          <div className="login-card__footer">
            <span className="login-card__footer-icon">
              <MoneyIcon size={16} />
            </span>
            <p>Attendance, tasks, payroll, and leave stay in one calm flow.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
