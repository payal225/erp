import { useEffect, useState } from "react";
import API from "../api/axios";
import "../styles/task.css";
import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  TasksIcon,
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

const createTaskForm = () => ({
  title: "",
  description: "",
  assignedTo: "",
  assignedName: "",
  priority: "Medium",
  status: "Pending",
  dueDate: "",
});

const PRIORITY_TONES = {
  High: "danger",
  Medium: "warning",
  Low: "success",
};

const STATUS_TONES = {
  Pending: "warning",
  "In Progress": "info",
  Done: "success",
};

const getDayDelta = (value) => {
  if (!value) {
    return null;
  }

  const dueDate = new Date(`${value}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  return Math.round((dueDate.getTime() - today.getTime()) / 86400000);
};

const getDueLabel = (value) => {
  const dayDelta = getDayDelta(value);

  if (dayDelta === null) {
    return "No due date";
  }

  if (dayDelta === 0) {
    return "Due today";
  }

  if (dayDelta < 0) {
    return `${Math.abs(dayDelta)} day${Math.abs(dayDelta) === 1 ? "" : "s"} overdue`;
  }

  return `Due in ${dayDelta} day${dayDelta === 1 ? "" : "s"}`;
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [form, setForm] = useState(createTaskForm);

  const fetchData = async () => {
    try {
      const [tasksResponse, employeesResponse] = await Promise.all([
        API.get("/tasks"),
        API.get("/employees"),
      ]);

      setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
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
    setEditTask(null);
    setForm(createTaskForm());
  };

  const openCreateForm = () => {
    setEditTask(null);
    setForm(createTaskForm());
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editTask) {
        await API.put(`/tasks/${editTask.id}`, form);
      } else {
        await API.post("/tasks", form);
      }

      closeForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save task.");
    }
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo || "",
      assignedName: task.assignedName || "",
      priority: task.priority || "Medium",
      status: task.status || "Pending",
      dueDate: task.dueDate || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete task.");
    }
  };

  const handleStatusChange = async (task, status) => {
    try {
      await API.put(`/tasks/${task.id}`, { status });
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, status } : item))
      );
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update task status.");
    }
  };

  const handleEmployeeChange = (event) => {
    const employee = employees.find((item) => item.id === event.target.value);

    setForm((current) => ({
      ...current,
      assignedTo: employee?.id || "",
      assignedName: employee?.name || "",
    }));
  };

  const searchTerm = search.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchTerm ||
      [task.title, task.description, task.assignedName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));
    const matchesPriority = filterPriority === "All" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "All" || task.status === filterStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const pendingCount = tasks.filter((task) => task.status === "Pending").length;
  const inProgressCount = tasks.filter((task) => task.status === "In Progress").length;
  const doneCount = tasks.filter((task) => task.status === "Done").length;
  const highPriorityCount = tasks.filter((task) => task.priority === "High").length;
  const dueSoonCount = tasks.filter((task) => {
    const dayDelta = getDayDelta(task.dueDate);
    return task.status !== "Done" && dayDelta !== null && dayDelta >= 0 && dayDelta <= 7;
  }).length;

  if (loading) {
    return <LoadingState label="Loading tasks..." />;
  }

  return (
    <div className="content-stack">
      <PageHeader
        
        title="Task board"
        meta={`${tasks.length} tasks tracked across the current workspace`}
        action={
          user?.role === "admin" ? (
            <button type="button" className="button button--primary" onClick={openCreateForm}>
              <PlusIcon size={16} />
              Add task
            </button>
          ) : null
        }
      />

      <section className="panel page-banner fade-up">
        <div className="page-banner__copy">
          
          <h2>Keep work moving.</h2>
          <p>Track owners, urgency, and status from one screen.</p>
          <div className="page-banner__actions">
            <StatusPill tone="warning">{pendingCount} pending</StatusPill>
            <StatusPill tone="info">{inProgressCount} in progress</StatusPill>
            <StatusPill tone="success">{doneCount} done</StatusPill>
          </div>
        </div>

        <div className="page-banner__stats">
          <div className="page-banner__stat">
            <strong>High priority</strong>
            <span>{highPriorityCount}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>Due soon</strong>
            <span>{dueSoonCount}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>Visible tasks</strong>
            <span>{filteredTasks.length}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>Update mode</strong>
            <span>{user?.role === "admin" ? "Full control" : "Status only"}</span>
            
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          tone="accent"
          icon={<TasksIcon size={20} />}
          label="All tasks"
          value={tasks.length}
          hint={`${filteredTasks.length} visible after filters`}
        />
        <MetricCard
          tone="danger"
          icon={<AlertIcon size={20} />}
          label="High priority"
          value={highPriorityCount}
          hint="Critical work that may need closer review"
        />
        <MetricCard
          tone="warning"
          icon={<ClockIcon size={20} />}
          label="Due this week"
          value={dueSoonCount}
          hint="Open items due in the next seven days"
        />
        <MetricCard
          tone="success"
          icon={<CheckIcon size={20} />}
          label="Completed"
          value={doneCount}
          hint={`${pendingCount + inProgressCount} tasks still moving`}
        />
      </div>

        <Panel
        title="Task list"
        subtitle="Search and filter tasks."
        className="table-shell"
      >
        <div className="content-stack">
          {user?.role === "employee" ? (
            <div className="summary-note">
              <strong>Status updates stay lightweight.</strong>
              <p>Use the table dropdown to update your tasks.</p>
            </div>
          ) : null}

          <div className="toolbar">
            <div className="toolbar__field">
              <span className="toolbar__icon">
                <SearchIcon size={16} />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by task title, assignee, or description"
              />
            </div>

            <div className="toolbar__field toolbar__field--small">
              <span className="toolbar__icon">
                <AlertIcon size={16} />
              </span>
              <select
                value={filterPriority}
                onChange={(event) => setFilterPriority(event.target.value)}
              >
                <option value="All">All priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="toolbar__field toolbar__field--small">
              <span className="toolbar__icon">
                <TasksIcon size={16} />
              </span>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>

          {filteredTasks.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Due date</th>
                    <th>Status</th>
                    {user?.role === "admin" ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{task.title}</strong>
                          <p>{task.description || "No extra description provided."}</p>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{task.assignedName || "Unassigned"}</strong>
                          <p>{task.assignedTo || "No owner selected yet"}</p>
                        </div>
                      </td>
                      <td>
                        <StatusPill tone={PRIORITY_TONES[task.priority] || "neutral"}>
                          {task.priority}
                        </StatusPill>
                      </td>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{formatDateLabel(task.dueDate)}</strong>
                          <p>{getDueLabel(task.dueDate)}</p>
                        </div>
                      </td>
                      <td>
                        {user?.role === "employee" ? (
                          <select
                            className="status-select"
                            value={task.status}
                            onChange={(event) => handleStatusChange(task, event.target.value)}
                            aria-label={`Update status for ${task.title}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                          </select>
                        ) : (
                          <StatusPill tone={STATUS_TONES[task.status] || "neutral"}>
                            {task.status}
                          </StatusPill>
                        )}
                      </td>
                      {user?.role === "admin" ? (
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="button button--ghost button--small"
                              onClick={() => handleEdit(task)}
                            >
                              <EditIcon size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="button button--danger button--small"
                              onClick={() => handleDelete(task.id)}
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
              icon={<TasksIcon size={28} />}
              title="No tasks match this view"
              description="Clear the filters or create a task."
              action={
                user?.role === "admin" ? (
                  <button type="button" className="button button--primary" onClick={openCreateForm}>
                    <PlusIcon size={16} />
                    Add task
                  </button>
                ) : null
              }
            />
          )}
        </div>
      </Panel>

      {showForm ? (
        <Modal
          title={editTask ? "Update task" : "Add task"}
          subtitle="Save the task details."
          onClose={closeForm}
          width="48rem"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field form-grid__full">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  required
                />
              </div>

              <div className="form-field form-grid__full">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Add a short task note."
                  
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="task-assignee">Assign to</label>
                <select
                  id="task-assignee"
                  value={form.assignedTo}
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
                <label htmlFor="task-due-date">Due date</label>
                <input
                  id="task-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: event.target.value })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="button button--ghost" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="button button--primary">
                {editTask ? "Save changes" : "Create task"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Tasks;
