import { useEffect, useState } from "react";
import API from "../api/axios";
import {
  AlertIcon,
  AttendanceIcon,
  CalendarIcon,
  ClockIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
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

const createAttendanceForm = () => ({
  employeeId: "",
  employeeName: "",
  date: "",
  status: "Present",
  checkIn: "",
  checkOut: "",
});

const ATTENDANCE_TONES = {
  Present: "success",
  Absent: "danger",
  "Half Day": "warning",
  Leave: "secondary",
};

const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [form, setForm] = useState(createAttendanceForm);

  const fetchData = async () => {
    try {
      const [attendanceResponse, employeesResponse] = await Promise.all([
        API.get("/attendance"),
        API.get("/employees"),
      ]);

      setRecords(Array.isArray(attendanceResponse.data) ? attendanceResponse.data : []);
      setEmployees(Array.isArray(employeesResponse.data) ? employeesResponse.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setEditRecord(null);
    setForm(createAttendanceForm());
  };

  const openCreateForm = () => {
    setEditRecord(null);
    setForm(createAttendanceForm());
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editRecord) {
        await API.put(`/attendance/${editRecord.id}`, form);
      } else {
        await API.post("/attendance", form);
      }

      closeForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save attendance.");
    }
  };

  const handleEdit = (record) => {
    setEditRecord(record);
    setForm({
      employeeId: record.employeeId || "",
      employeeName: record.employeeName || "",
      date: record.date || "",
      status: record.status || "Present",
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Delete this attendance record?")) {
      return;
    }

    try {
      await API.delete(`/attendance/${recordId}`);
      setRecords((current) => current.filter((record) => record.id !== recordId));
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete attendance.");
    }
  };

  const handleEmployeeChange = (event) => {
    const employee = employees.find((item) => item.id === event.target.value);

    setForm((current) => ({
      ...current,
      employeeId: employee?.id || "",
      employeeName: employee?.name || "",
    }));
  };

  const searchTerm = search.trim().toLowerCase();
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      !searchTerm ||
      [record.employeeName, record.date, record.employeeId]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));
    const matchesStatus = filterStatus === "All" || record.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const presentCount = records.filter((record) => record.status === "Present").length;
  const absentCount = records.filter((record) => record.status === "Absent").length;
  const halfDayCount = records.filter((record) => record.status === "Half Day").length;
  const leaveCount = records.filter((record) => record.status === "Leave").length;
  const incompleteTimes = records.filter((record) => !record.checkIn || !record.checkOut).length;
  const latestRecordDate = records
    .map((record) => record.date)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .at(-1);

  if (loading) {
    return <LoadingState label="Loading attendance..." />;
  }

  return (
    <div className="content-stack">
      <PageHeader
        title="Attendance records"
       
        meta={
          latestRecordDate
            ? `Latest record: ${formatDateLabel(latestRecordDate)}`
            : "No attendance records captured yet"
        }
        action={
          user?.role === "admin" ? (
            <button type="button" className="button button--primary" onClick={openCreateForm}>
              <PlusIcon size={16} />
              Add record
            </button>
          ) : null
        }
      />

      <section className="panel page-banner fade-up">
        <div className="page-banner__copy">
          <p className="eyebrow"><h2>Coverage snapshot</h2></p>
          
          <p>Review status and missing timings in one place.</p>
          <div className="page-banner__actions">
            <StatusPill tone="success">{presentCount} present</StatusPill>
            <StatusPill tone="danger">{absentCount} absent</StatusPill>
            <StatusPill tone="warning">{incompleteTimes} incomplete</StatusPill>
          </div>
        </div>

        <div className="page-banner__stats">
          <div className="page-banner__stat">
            <strong>Total records</strong>
            <span>{records.length}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>Half days</strong>
            <span>{halfDayCount}</span>
           
          </div>
          <div className="page-banner__stat">
            <strong>On leave</strong>
            <span>{leaveCount}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>Visible records</strong>
            <span>{filteredRecords.length}</span>
           
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          tone="accent"
          icon={<AttendanceIcon size={20} />}
          label="Attendance entries"
          value={records.length}
          hint={`${filteredRecords.length} matching the current view`}
        />
        <MetricCard
          tone="success"
          icon={<UsersIcon size={20} />}
          label="Present"
          value={presentCount}
          hint={`${leaveCount} on leave today`}
        />
        <MetricCard
          tone="danger"
          icon={<AlertIcon size={20} />}
          label="Absent"
          value={absentCount}
          hint={`${halfDayCount} half-day records`}
        />
        <MetricCard
          tone="warning"
          icon={<ClockIcon size={20} />}
          label="Incomplete times"
          value={incompleteTimes}
          hint="Missing check-in or check-out data"
        />
      </div>

        <Panel
        title="Attendance log"
        subtitle="Search and filter records."
        className="table-shell"
      >
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
                placeholder="Search by employee name, ID, or date"
              />
            </div>

            <div className="toolbar__field toolbar__field--small">
              <span className="toolbar__icon">
                <CalendarIcon size={16} />
              </span>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <option value="All">All statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Half Day">Half Day</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>

          {filteredRecords.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Shift window</th>
                    <th>Status</th>
                    {user?.role === "admin" ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{record.employeeName}</strong>
                          <p>{record.employeeId || "Employee record linked"}</p>
                        </div>
                      </td>
                      <td>{formatDateLabel(record.date)}</td>
                      <td>
                        <div className="table-cell-stack">
                          <strong>
                            {record.checkIn || "-"} to {record.checkOut || "-"}
                          </strong>
                          <p>
                            {record.checkIn && record.checkOut
                              ? "Check-in and check-out captured"
                              : "Time capture is incomplete"}
                          </p>
                        </div>
                      </td>
                      <td>
                        <StatusPill tone={ATTENDANCE_TONES[record.status] || "neutral"}>
                          {record.status}
                        </StatusPill>
                      </td>
                      {user?.role === "admin" ? (
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="button button--ghost button--small"
                              onClick={() => handleEdit(record)}
                            >
                              <EditIcon size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="button button--danger button--small"
                              onClick={() => handleDelete(record.id)}
                            >
                              <TrashIcon size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<AttendanceIcon size={28} />}
              title="No attendance records match this view"
              description="Try another filter or clear the search."
              action={
                user?.role === "admin" ? (
                  <button type="button" className="button button--primary" onClick={openCreateForm}>
                    <PlusIcon size={16} />
                    Add record
                  </button>
                ) : null
              }
            />
          )}
        </div>
      </Panel>

      {showForm ? (
        <Modal
          title={editRecord ? "Update attendance" : "Add attendance"}
          subtitle="Save the attendance details."
          onClose={closeForm}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field form-grid__full">
                <label htmlFor="attendance-employee">Employee</label>
                <select
                  id="attendance-employee"
                  value={form.employeeId}
                  onChange={handleEmployeeChange}
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="attendance-date">Date</label>
                <input
                  id="attendance-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="attendance-status">Status</label>
                <select
                  id="attendance-status"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="attendance-check-in">Check in</label>
                <input
                  id="attendance-check-in"
                  type="time"
                  value={form.checkIn}
                  onChange={(event) => setForm({ ...form, checkIn: event.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="attendance-check-out">Check out</label>
                <input
                  id="attendance-check-out"
                  type="time"
                  value={form.checkOut}
                  onChange={(event) => setForm({ ...form, checkOut: event.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="button button--ghost" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="button button--primary">
                {editRecord ? "Save changes" : "Create record"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Attendance;
