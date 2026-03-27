import { useEffect, useState } from "react";
import API from "../api/axios";
import "../styles/leave.css";
import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  LeaveIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "../components/Icons";
import {
  EmptyState,
  LoadingState,
  MetricCard,
  Modal,
  PageHeader,
  Panel,
  StatusPill,
} from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { formatDateLabel } from "../utils/formatters";

const createLeaveForm = () => ({
  leaveType: "Casual",
  startDate: "",
  endDate: "",
  reason: "",
});

const createReviewForm = () => ({
  status: "Approved",
  reviewNote: "",
});

const LEAVE_TONES = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
};

const getLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
};

const formatLeaveDays = (days) => `${days} day${days === 1 ? "" : "s"}`;

const formatLeaveRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return "-";
  }

  if (startDate === endDate) {
    return formatDateLabel(startDate);
  }

  return `${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`;
};

const Leave = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [form, setForm] = useState(createLeaveForm);
  const [reviewForm, setReviewForm] = useState(createReviewForm);

  const fetchRequests = async () => {
    try {
      const response = await API.get("/leave");
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const closeCreateForm = () => {
    setShowForm(false);
    setForm(createLeaveForm());
  };

  const openReview = (request) => {
    setActiveRequest(request);
    setReviewForm({
      status: request.status === "Rejected" ? "Rejected" : "Approved",
      reviewNote: request.reviewNote || "",
    });
    setShowReview(true);
  };

  const closeReview = () => {
    setShowReview(false);
    setActiveRequest(null);
    setReviewForm(createReviewForm());
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (getLeaveDays(form.startDate, form.endDate) <= 0) {
      alert("End date must be the same as or later than the start date.");
      return;
    }

    try {
      await API.post("/leave", form);
      closeCreateForm();
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save leave request.");
    }
  };

  const handleReview = async (event) => {
    event.preventDefault();

    try {
      await API.put(`/leave/${activeRequest.id}`, reviewForm);
      closeReview();
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to review leave request.");
    }
  };

  const handleWithdraw = async (request) => {
    if (!window.confirm("Withdraw this leave request?")) {
      return;
    }

    try {
      await API.delete(`/leave/${request.id}`);
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (error) {
      alert(error.response?.data?.message || "Unable to withdraw leave request.");
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      !searchTerm ||
      [request.employeeName, request.leaveType, request.reason, request.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));
    const matchesStatus = filterStatus === "All" || request.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((request) => request.status === "Pending").length;
  const approvedCount = requests.filter((request) => request.status === "Approved").length;
  const rejectedCount = requests.filter((request) => request.status === "Rejected").length;
  const totalDays = requests.reduce(
    (sum, request) => sum + getLeaveDays(request.startDate, request.endDate),
    0
  );
  const approvedDays = requests
    .filter((request) => request.status === "Approved")
    .reduce((sum, request) => sum + getLeaveDays(request.startDate, request.endDate), 0);

  if (loading) {
    return <LoadingState label="Loading leave requests..." />;
  }

  return (
    <div className="content-stack">
      <PageHeader
        title="Leave requests"
        
        meta={`${pendingCount} pending request${pendingCount === 1 ? "" : "s"}`}
        action={
          <button type="button" className="button button--primary" onClick={() => setShowForm(true)}>
            <PlusIcon size={16} />
            New request
          </button>
        }
      />

      <section className="panel page-banner fade-up">
        <div className="page-banner__copy">
          <p className="eyebrow"><h2>{user?.role === "admin" ? "Review queue" : "Your requests"}</h2></p>
          <p>
            {user?.role === "admin"
              ? "See pending requests, review notes, and leave ranges in one place."
              : "Create a request, watch its status, and keep your leave history easy to find."}
          </p>
          <div className="page-banner__actions">
            <StatusPill tone="warning">{pendingCount} pending</StatusPill>
            <StatusPill tone="success">{approvedCount} approved</StatusPill>
            <StatusPill tone="danger">{rejectedCount} rejected</StatusPill>
          </div>
        </div>

        <div className="page-banner__stats">
          <div className="page-banner__stat">
            <strong>Total requests</strong>
            <span>{requests.length}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>Total days</strong>
            <span>{totalDays}</span>
           
          </div>
          <div className="page-banner__stat">
            <strong>Approved days</strong>
            <span>{approvedDays}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>Visible requests</strong>
            <span>{filteredRequests.length}</span>
           
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          tone="accent"
          icon={<LeaveIcon size={20} />}
          label="Requests"
          value={requests.length}
          hint={`${filteredRequests.length} in the current view`}
        />
        <MetricCard
          tone="warning"
          icon={<ClockIcon size={20} />}
          label="Pending"
          value={pendingCount}
          hint="Waiting for review"
        />
        <MetricCard
          tone="success"
          icon={<CheckIcon size={20} />}
          label="Approved"
          value={approvedCount}
          hint={`${approvedDays} approved leave days`}
        />
        <MetricCard
          tone="danger"
          icon={<AlertIcon size={20} />}
          label="Rejected"
          value={rejectedCount}
          hint="Requests not approved"
        />
      </div>

      <Panel title="Request log" subtitle="Search and filter leave requests." className="table-shell">
        <div className="content-stack">
          <div className="toolbar">
            <div className="toolbar__field">
              <span className="toolbar__icon">
                <SearchIcon size={16} />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by employee, type, reason, or status"
              />
            </div>

            <div className="toolbar__field toolbar__field--small">
              <span className="toolbar__icon">
                <CalendarIcon size={16} />
              </span>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredRequests.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {user?.role === "admin" ? <th>Employee</th> : null}
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => {
                    const days = getLeaveDays(request.startDate, request.endDate);

                    return (
                      <tr key={request.id}>
                        {user?.role === "admin" ? (
                          <td>
                            <div className="table-cell-stack">
                              <strong>{request.employeeName}</strong>
                              <p>{request.employeeId}</p>
                            </div>
                          </td>
                        ) : null}
                        <td>
                          <div className="table-cell-stack">
                            <strong>{request.leaveType}</strong>
                            <p>Created {formatDateLabel(request.createdAt)}</p>
                          </div>
                        </td>
                        <td>{formatLeaveRange(request.startDate, request.endDate)}</td>
                        <td>{formatLeaveDays(days)}</td>
                        <td>
                          <div className="table-cell-stack">
                            <strong>{request.reason}</strong>
                            <p>
                              {request.reviewNote
                                ? `Note: ${request.reviewNote}`
                                : "No review note yet"}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="table-cell-stack">
                            <StatusPill tone={LEAVE_TONES[request.status] || "neutral"}>
                              {request.status}
                            </StatusPill>
                            <p>
                              {request.reviewedBy
                                ? `By ${request.reviewedBy} on ${formatDateLabel(request.reviewedAt)}`
                                : "Awaiting review"}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="table-actions">
                            {user?.role === "admin" ? (
                              <button
                                type="button"
                                className="button button--ghost button--small"
                                onClick={() => openReview(request)}
                              >
                                Review
                              </button>
                            ) : request.status === "Pending" ? (
                              <button
                                type="button"
                                className="button button--danger button--small"
                                onClick={() => handleWithdraw(request)}
                              >
                                <TrashIcon size={14} />
                                Withdraw
                              </button>
                            ) : (
                              <StatusPill tone="neutral">Locked</StatusPill>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<LeaveIcon size={28} />}
              title="No leave requests found"
              description="Clear the filters or add a new leave request."
              action={
                <button type="button" className="button button--primary" onClick={() => setShowForm(true)}>
                  <PlusIcon size={16} />
                  New request
                </button>
              }
            />
          )}
        </div>
      </Panel>

      {showForm ? (
        <Modal
          title="New leave request"
          subtitle="Choose your leave type, dates, and reason."
          onClose={closeCreateForm}
          width="44rem"
        >
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="leave-type">Leave type</label>
                <select
                  id="leave-type"
                  value={form.leaveType}
                  onChange={(event) => setForm({ ...form, leaveType: event.target.value })}
                >
                  <option value="Casual">Casual</option>
                  <option value="Sick">Sick</option>
                  <option value="Annual">Annual</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="leave-start">Start date</label>
                <input
                  id="leave-start"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="leave-end">End date</label>
                <input
                  id="leave-end"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                  required
                />
                <p className="field-hint">
                  {getLeaveDays(form.startDate, form.endDate) > 0
                    ? formatLeaveDays(getLeaveDays(form.startDate, form.endDate))
                    : "Choose a valid date range."}
                </p>
              </div>

              <div className="form-field form-grid__full">
                <label htmlFor="leave-reason">Reason</label>
                <textarea
                  id="leave-reason"
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  placeholder="Add a short reason."
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="button button--ghost" onClick={closeCreateForm}>
                Cancel
              </button>
              <button type="submit" className="button button--primary">
                Submit request
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showReview && activeRequest ? (
        <Modal
          title={`Review ${activeRequest.employeeName}`}
          subtitle={`${activeRequest.leaveType} | ${formatLeaveRange(
            activeRequest.startDate,
            activeRequest.endDate
          )}`}
          onClose={closeReview}
          width="40rem"
        >
          <form onSubmit={handleReview}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="review-status">Decision</label>
                <select
                  id="review-status"
                  value={reviewForm.status}
                  onChange={(event) =>
                    setReviewForm({ ...reviewForm, status: event.target.value })
                  }
                >
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                </select>
              </div>

              <div className="form-field form-grid__full">
                <label htmlFor="review-note">Review note</label>
                <textarea
                  id="review-note"
                  value={reviewForm.reviewNote}
                  onChange={(event) =>
                    setReviewForm({ ...reviewForm, reviewNote: event.target.value })
                  }
                  placeholder="Optional note"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="button button--ghost" onClick={closeReview}>
                Cancel
              </button>
              <button type="submit" className="button button--primary">
                Save decision
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Leave;
