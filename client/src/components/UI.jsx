import { CloseIcon } from "./Icons";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export const PageHeader = ({ eyebrow, title, description, meta, action }) => (
  <div className="page-header fade-up">
    <div className="page-header__copy">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="page-title">{title}</h1>
      {description ? <p className="page-description">{description}</p> : null}
      {meta ? <p className="page-meta">{meta}</p> : null}
    </div>
    {action ? <div>{action}</div> : null}
  </div>
);

export const Panel = ({ title, subtitle, action, children, className, bodyClassName }) => (
  <section className={joinClasses("panel fade-up", className)}>
    {(title || subtitle || action) ? (
      <div className="panel__header">
        <div className="panel__title-group">
          {title ? <h2>{title}</h2> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    ) : null}
    <div className={joinClasses("panel__body", bodyClassName)}>{children}</div>
  </section>
);

export const MetricCard = ({ icon, label, value, hint, tone = "accent" }) => (
  <div className={joinClasses("metric-card fade-up", `metric-card--${tone}`)}>
    <div className="metric-card__icon">{icon}</div>
    <div className="metric-card__copy">
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {hint ? <p className="metric-card__hint">{hint}</p> : null}
    </div>
  </div>
);

export const StatusPill = ({ children, tone = "neutral", className }) => (
  <span className={joinClasses("pill", `pill--${tone}`, className)}>{children}</span>
);

export const EmptyState = ({ title, description, icon, action }) => (
  <div className="empty-state">
    <div className="empty-state__inner">
      {icon ? <div className="empty-state__icon">{icon}</div> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  </div>
);

export const LoadingState = ({ label = "Loading..." }) => (
  <div className="loading-state">
    <div className="loading-state__inner">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  </div>
);

export const Modal = ({ title, subtitle, children, onClose, width }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div
      className="modal-card fade-up"
      onClick={(event) => event.stopPropagation()}
      style={width ? { maxWidth: width } : undefined}
    >
      <div className="modal-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <button
          type="button"
          className="button button--ghost button--icon"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <CloseIcon size={18} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

