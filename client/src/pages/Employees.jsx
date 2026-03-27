import { useEffect, useState } from "react";
import API from "../api/axios";
import "../styles/employee.css";
import {
  CalendarIcon,
  EditIcon,
  MoneyIcon,
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
import { formatCurrency, formatDateLabel } from "../utils/formatters";

const createEmployeeForm = () => ({
  name: "",
  email: "",
  phone: "",
  department: "",
  role: "employee",
  salary: "",
  joiningDate: "",
  status: "Active",
});

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [form, setForm] = useState(createEmployeeForm);

  const fetchEmployees = async () => {
    try {
      const response = await API.get("/employees");
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setEditEmployee(null);
    setForm(createEmployeeForm());
  };

  const openCreateForm = () => {
    setEditEmployee(null);
    setForm(createEmployeeForm());
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      salary: Number(form.salary || 0),
    };

    try {
      if (editEmployee) {
        await API.put(`/employees/${editEmployee.id}`, payload);
      } else {
        await API.post("/employees", payload);
      }

      closeForm();
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save employee.");
    }
  };

  const handleEdit = (employee) => {
    setEditEmployee(employee);
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      role: employee.role || "employee",
      salary: employee.salary ?? "",
      joiningDate: employee.joiningDate || "",
      status: employee.status || "Active",
    });
    setShowForm(true);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Delete this employee record?")) {
      return;
    }

    try {
      await API.delete(`/employees/${employeeId}`);
      setEmployees((current) => current.filter((employee) => employee.id !== employeeId));
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete employee.");
    }
  };

  const departmentOptions = [
    "All",
    ...Array.from(
      new Set(employees.map((employee) => employee.department).filter(Boolean))
    ).sort((left, right) => left.localeCompare(right)),
  ];

  const searchTerm = search.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      !searchTerm ||
      [employee.name, employee.email, employee.department, employee.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));
    const matchesDepartment = filterDept === "All" || employee.department === filterDept;

    return matchesSearch && matchesDepartment;
  });

  const activeCount = employees.filter((employee) => employee.status === "Active").length;
  const inactiveCount = employees.filter((employee) => employee.status !== "Active").length;
  const departmentCount = departmentOptions.length - 1;
  const totalCompensation = employees.reduce(
    (total, employee) => total + Number(employee.salary || 0),
    0
  );

  if (loading) {
    return <LoadingState label="Loading employees..." />;
  }

  return (
    <div className="content-stack">
      <PageHeader
        
        title="Employee directory"
       
        meta={
          user?.role === "admin"
            ? `${employees.length} employee records tracked across ${departmentCount} departments`
            : "Your employee profile and employment details"
        }
        action={
          user?.role === "admin" ? (
            <button type="button" className="button button--primary" onClick={openCreateForm}>
              <PlusIcon size={16} />
              Add employee
            </button>
          ) : null
        }
      />

      <section className="panel page-banner fade-up">
        <div className="page-banner__copy">
          <p className="eyebrow"><h2>Roster health</h2></p>
          
          <p>Search, filter, and edit from one screen.</p>
          <div className="page-banner__actions">
            <StatusPill tone="success">{activeCount} active</StatusPill>
            <StatusPill tone="secondary">{departmentCount} departments</StatusPill>
            <StatusPill tone="accent">{filteredEmployees.length} visible</StatusPill>
          </div>
        </div>

        <div className="page-banner__stats">
          <div className="page-banner__stat">
            <strong>Team size</strong>
            <span>{employees.length}</span>
           
          </div>
          <div className="page-banner__stat">
            <strong>Compensation base</strong>
            <span>{formatCurrency(totalCompensation)}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>Inactive records</strong>
            <span>{inactiveCount}</span>
            
          </div>
          <div className="page-banner__stat">
            <strong>View mode</strong>
            <span>{user?.role === "admin" ? "Admin" : "Employee"}</span>
            
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          tone="accent"
          icon={<UsersIcon size={20} />}
          label="Employees"
          value={employees.length}
          hint={`${filteredEmployees.length} visible after filters`}
        />
        <MetricCard
          tone="success"
          icon={<CalendarIcon size={20} />}
          label="Active team members"
          value={activeCount}
          hint={`${inactiveCount} inactive records`}
        />
        <MetricCard
          tone="secondary"
          icon={<UsersIcon size={20} />}
          label="Departments"
          value={departmentCount}
          hint="Management, engineering, HR, and more"
        />
        <MetricCard
          tone="info"
          icon={<MoneyIcon size={20} />}
          label="Salary base"
          value={formatCurrency(totalCompensation)}
          hint="Current monthly compensation footprint"
        />
      </div>

        <Panel
        title="Directory table"
        subtitle="Search and filter the roster."
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
                placeholder="Search by name, email, department, or phone"
              />
            </div>

            <div className="toolbar__field toolbar__field--small">
              <span className="toolbar__icon">
                <UsersIcon size={16} />
              </span>
              <select value={filterDept} onChange={(event) => setFilterDept(event.target.value)}>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredEmployees.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Compensation</th>
                    <th>Joined</th>
                    <th>Status</th>
                    {user?.role === "admin" ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{employee.name}</strong>
                          <p>
                            {employee.email} | {employee.phone || "No phone added"}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{employee.department || "Unassigned"}</strong>
                          <p>{employee.role === "admin" ? "Administrator" : "Employee"}</p>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{formatCurrency(employee.salary)}</strong>
                          <p>Current monthly salary</p>
                        </div>
                      </td>
                      <td>{formatDateLabel(employee.joiningDate)}</td>
                      <td>
                        <StatusPill
                          tone={employee.status === "Active" ? "success" : "danger"}
                        >
                          {employee.status}
                        </StatusPill>
                      </td>
                      {user?.role === "admin" ? (
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="button button--ghost button--small"
                              onClick={() => handleEdit(employee)}
                            >
                              <EditIcon size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="button button--danger button--small"
                              onClick={() => handleDelete(employee.id)}
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
              icon={<UsersIcon size={28} />}
              title="No employees match this view"
              description="Clear the search or change the department filter."
              action={
                user?.role === "admin" ? (
                  <button type="button" className="button button--primary" onClick={openCreateForm}>
                    <PlusIcon size={16} />
                    Add employee
                  </button>
                ) : null
              }
            />
          )}
        </div>
      </Panel>

      {showForm ? (
        <Modal
          title={editEmployee ? "Update employee" : "Add employee"}
          subtitle="Save the core employee details."
          onClose={closeForm}
          width="48rem"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="employee-name">Full name</label>
                <input
                  id="employee-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="employee-email">Email</label>
                <input
                  id="employee-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="employee-phone">Phone</label>
                <input
                  id="employee-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="employee-department">Department</label>
                <input
                  id="employee-department"
                  type="text"
                  value={form.department}
                  onChange={(event) => setForm({ ...form, department: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="employee-salary">Salary</label>
                <input
                  id="employee-salary"
                  type="number"
                  min="0"
                  value={form.salary}
                  onChange={(event) => setForm({ ...form, salary: event.target.value })}
                  required
                />
                <p className="field-hint">Base pay for payroll.</p>
                
              </div>

              <div className="form-field">
                <label htmlFor="employee-joining-date">Joining date</label>
                <input
                  id="employee-joining-date"
                  type="date"
                  value={form.joiningDate}
                  onChange={(event) => setForm({ ...form, joiningDate: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="employee-role">Role</label>
                <select
                  id="employee-role"
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="employee-status">Status</label>
                <select
                  id="employee-status"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="button button--ghost" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="button button--primary">
                {editEmployee ? "Save changes" : "Create employee"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Employees;
