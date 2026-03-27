import { useEffect, useState } from "react";
import API from "../api/axios";
import "../styles/payroll.css";
import {
  CalendarIcon,
  EditIcon,
  MoneyIcon,
  PayrollIcon,
  PlusIcon,
  PrintIcon,
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

const createPayrollForm = () => ({
  employeeId: "",
  employeeName: "",
  month: "",
  basicSalary: "",
  bonus: "",
  deductions: "",
  status: "Pending",
  paidOn: "",
});

const printPayslip = (record) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    return;
  }

  const totalBonus = Number(record.bonus || 0);
  const totalDeductions = Number(record.deductions || 0);
  const baseSalary = Number(record.basicSalary || 0);
  const netSalary = Number(record.netSalary || 0);
  const statusColor = record.status === "Paid" ? "#2a845f" : "#b77828";
  const statusBackground = record.status === "Paid" ? "#e8f6ef" : "#fff2dc";

  printWindow.document.write(`
    <html>
      <head>
        <title>Payslip - ${record.employeeName}</title>
        <style>
          body {
            margin: 0;
            padding: 40px;
            font-family: "Segoe UI", sans-serif;
            color: #18212a;
            background: #f7f2ea;
          }
          .sheet {
            max-width: 720px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 24px 60px rgba(24, 33, 42, 0.12);
          }
          .hero {
            padding: 32px;
            background: linear-gradient(135deg, #18212a, #2f6c68 70%, #c96a3d 130%);
            color: #fff8f1;
          }
          .hero h1,
          .hero p,
          .section h2,
          .section p,
          .grid strong,
          .grid span,
          .summary strong,
          .summary span {
            margin: 0;
          }
          .hero h1 {
            font-size: 28px;
            line-height: 1.1;
          }
          .hero p {
            margin-top: 10px;
            opacity: 0.82;
            line-height: 1.6;
          }
          .section {
            padding: 28px 32px;
            border-top: 1px solid #ece2d8;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 18px;
          }
          .card,
          .summary {
            padding: 18px;
            border-radius: 18px;
            border: 1px solid #ece2d8;
            background: #fbf8f3;
          }
          .card strong,
          .summary strong {
            display: block;
            color: #61707d;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }
          .card span {
            display: block;
            margin-top: 8px;
            font-size: 18px;
            font-weight: 700;
          }
          .summary-list {
            margin-top: 18px;
            display: grid;
            gap: 12px;
          }
          .summary {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
          }
          .summary span {
            font-weight: 700;
          }
          .summary--net {
            background: #18212a;
            border-color: #18212a;
            color: #fff8f1;
          }
          .summary--net strong {
            color: rgba(255, 248, 241, 0.72);
          }
          .pill {
            display: inline-block;
            margin-top: 16px;
            padding: 8px 14px;
            border-radius: 999px;
            background: ${statusBackground};
            color: ${statusColor};
            font-weight: 700;
            font-size: 13px;
          }
          .footer {
            padding: 0 32px 28px;
            color: #61707d;
            font-size: 12px;
            text-align: center;
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .sheet {
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="hero">
            <h1>Mini ERP Payslip</h1>
            <p>${record.employeeName} | ${record.month}</p>
            <div class="pill">${record.status}</div>
          </div>

          <div class="section">
            <h2 style="font-size: 18px;">Employee details</h2>
            <div class="grid">
              <div class="card">
                <strong>Employee</strong>
                <span>${record.employeeName}</span>
              </div>
              <div class="card">
                <strong>Employee ID</strong>
                <span>${record.employeeId}</span>
              </div>
              <div class="card">
                <strong>Payroll month</strong>
                <span>${record.month}</span>
              </div>
              <div class="card">
                <strong>Paid on</strong>
                <span>${record.paidOn ? formatDateLabel(record.paidOn) : "Pending"}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 style="font-size: 18px;">Salary summary</h2>
            <div class="summary-list">
              <div class="summary">
                <strong>Base salary</strong>
                <span>${formatCurrency(baseSalary)}</span>
              </div>
              <div class="summary">
                <strong>Bonus</strong>
                <span>${formatCurrency(totalBonus)}</span>
              </div>
              <div class="summary">
                <strong>Deductions</strong>
                <span>${formatCurrency(totalDeductions)}</span>
              </div>
              <div class="summary summary--net">
                <strong>Net salary</strong>
                <span>${formatCurrency(netSalary)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })} by Mini ERP
          </div>
        </div>
        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

const Payroll = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [form, setForm] = useState(createPayrollForm);

  const fetchData = async () => {
    try {
      const [payrollResponse, employeesResponse] = await Promise.all([
        API.get("/payroll"),
        API.get("/employees"),
      ]);

      setRecords(Array.isArray(payrollResponse.data) ? payrollResponse.data : []);
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
    setForm(createPayrollForm());
  };

  const openCreateForm = () => {
    setEditRecord(null);
    setForm(createPayrollForm());
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      basicSalary: Number(form.basicSalary || 0),
      bonus: Number(form.bonus || 0),
      deductions: Number(form.deductions || 0),
    };

    try {
      if (editRecord) {
        await API.put(`/payroll/${editRecord.id}`, payload);
      } else {
        await API.post("/payroll", payload);
      }

      closeForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save payroll record.");
    }
  };

  const handleEdit = (record) => {
    setEditRecord(record);
    setForm({
      employeeId: record.employeeId || "",
      employeeName: record.employeeName || "",
      month: record.month || "",
      basicSalary: record.basicSalary ?? "",
      bonus: record.bonus ?? "",
      deductions: record.deductions ?? "",
      status: record.status || "Pending",
      paidOn: record.paidOn || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Delete this payroll record?")) {
      return;
    }

    try {
      await API.delete(`/payroll/${recordId}`);
      setRecords((current) => current.filter((record) => record.id !== recordId));
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete payroll record.");
    }
  };

  const handleEmployeeChange = (event) => {
    const employee = employees.find((item) => item.id === event.target.value);

    setForm((current) => ({
      ...current,
      employeeId: employee?.id || "",
      employeeName: employee?.name || "",
      basicSalary: employee?.salary ?? "",
    }));
  };

  const searchTerm = search.trim().toLowerCase();
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      !searchTerm ||
      [record.employeeName, record.month, record.employeeId]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));
    const matchesStatus = filterStatus === "All" || record.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPaid = records
    .filter((record) => record.status === "Paid")
    .reduce((total, record) => total + Number(record.netSalary || 0), 0);
  const totalPending = records
    .filter((record) => record.status === "Pending")
    .reduce((total, record) => total + Number(record.netSalary || 0), 0);
  const averageNet = records.length
    ? records.reduce((total, record) => total + Number(record.netSalary || 0), 0) / records.length
    : 0;
  const paidCount = records.filter((record) => record.status === "Paid").length;
  const pendingCount = records.filter((record) => record.status === "Pending").length;
  const latestPaidOn = records
    .map((record) => record.paidOn)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .at(-1);

  if (loading) {
    return <LoadingState label="Loading payroll..." />;
  }

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow="Compensation"
        title="Payroll records"
      
      
        action={
          user?.role === "admin" ? (
            <button type="button" className="button button--primary" onClick={openCreateForm}>
              <PlusIcon size={16} />
              Add payroll
            </button>
          ) : null
        }
      />

      <section className="panel page-banner fade-up">
        <div className="page-banner__copy">
          <p className="eyebrow"><h2>Payout overview</h2></p>
          
   
          <div className="page-banner__actions">
            <StatusPill tone="success">{paidCount} paid</StatusPill>
            <StatusPill tone="warning">{pendingCount} pending</StatusPill>
            <StatusPill tone="accent">{filteredRecords.length} visible</StatusPill>
          </div>
        </div>

        <div className="page-banner__stats">
          <div className="page-banner__stat">
            <strong>Total paid</strong>
            <span>{formatCurrency(totalPaid)}</span>
          </div>
          <div className="page-banner__stat">
            <strong>Total pending</strong>
            <span>{formatCurrency(totalPending)}</span>
          </div>
          <div className="page-banner__stat">
            <strong>Average payout</strong>
            <span>{formatCurrency(averageNet)}</span>
           
          </div>
          <div className="page-banner__stat">
            <strong>Last paid on</strong>
            <span>{latestPaidOn ? formatDateLabel(latestPaidOn) : "Pending"}</span>
            
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          tone="accent"
          icon={<PayrollIcon size={20} />}
          label="Payroll records"
          value={records.length}
         
        />
        <MetricCard
          tone="success"
          icon={<MoneyIcon size={20} />}
          label="Paid out"
          value={formatCurrency(totalPaid)}
        />
        <MetricCard
          tone="warning"
          icon={<CalendarIcon size={20} />}
          label="Pending value"
          value={formatCurrency(totalPending)}
          
        />
        <MetricCard
          tone="info"
          icon={<UsersIcon size={20} />}
          label="Average net"
          value={formatCurrency(averageNet)}
          
        />
      </div>

        <Panel
        title="Payroll register"
        subtitle="Search, filter, and print."
        className="table-shell"
      >
        <div className="content-stack">
          <div className="summary-note">
            <strong>Payslip printing is built into the flow.</strong>
            <p>Use Print on any row.</p>
          </div>

          <div className="toolbar">
            <div className="toolbar__field">
              <span className="toolbar__icon">
                <SearchIcon size={16} />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by employee name, ID, or payroll month"
              />
            </div>

            <div className="toolbar__field toolbar__field--small">
              <span className="toolbar__icon">
                <CalendarIcon size={16} />
              </span>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <option value="All">All statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {filteredRecords.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Month</th>
                    <th>Salary mix</th>
                    <th>Net salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{record.employeeName}</strong>
                          <p>{record.employeeId}</p>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-stack">
                          <strong>{record.month}</strong>
                          <p>{record.paidOn ? `Paid on ${formatDateLabel(record.paidOn)}` : "Awaiting payout"}</p>
                        </div>
                      </td>
                      <td>
                        <div className="salary-stack">
                          <span>Base: {formatCurrency(record.basicSalary)}</span>
                          <span>Bonus: {formatCurrency(record.bonus)}</span>
                          <span>Deductions: {formatCurrency(record.deductions)}</span>
                        </div>
                      </td>
                      <td className="table-emphasis">{formatCurrency(record.netSalary)}</td>
                      <td>
                        <StatusPill tone={record.status === "Paid" ? "success" : "warning"}>
                          {record.status}
                        </StatusPill>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button button--secondary button--small"
                            onClick={() => printPayslip(record)}
                          >
                            <PrintIcon size={14} />
                            Print
                          </button>
                          {user?.role === "admin" ? (
                            <>
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
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<PayrollIcon size={28} />}
              title="No payroll records match this view"
              description="Clear the filters or add a payroll entry."
              action={
                user?.role === "admin" ? (
                  <button type="button" className="button button--primary" onClick={openCreateForm}>
                    <PlusIcon size={16} />
                    Add payroll
                  </button>
                ) : null
              }
            />
          )}
        </div>
      </Panel>

      {showForm ? (
        <Modal
          title={editRecord ? "Update payroll" : "Add payroll"}
          subtitle="Save the payroll details."
          onClose={closeForm}
          width="48rem"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field form-grid__full">
                <label htmlFor="payroll-employee">Employee</label>
                <select
                  id="payroll-employee"
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
                <label htmlFor="payroll-month">Payroll month</label>
                <input
                  id="payroll-month"
                  type="text"
                  value={form.month}
                  onChange={(event) => setForm({ ...form, month: event.target.value })}
                  placeholder="March 2026"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="payroll-basic">Base salary</label>
                <input
                  id="payroll-basic"
                  type="number"
                  min="0"
                  value={form.basicSalary}
                  onChange={(event) => setForm({ ...form, basicSalary: event.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="payroll-bonus">Bonus</label>
                <input
                  id="payroll-bonus"
                  type="number"
                  min="0"
                  value={form.bonus}
                  onChange={(event) => setForm({ ...form, bonus: event.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="payroll-deductions">Deductions</label>
                <input
                  id="payroll-deductions"
                  type="number"
                  min="0"
                  value={form.deductions}
                  onChange={(event) => setForm({ ...form, deductions: event.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="payroll-status">Status</label>
                <select
                  id="payroll-status"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="payroll-paid-on">Paid on</label>
                <input
                  id="payroll-paid-on"
                  type="date"
                  value={form.paidOn}
                  onChange={(event) => setForm({ ...form, paidOn: event.target.value })}
                />
                <p className="field-hint">Leave blank for records that are still pending payout.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="button button--ghost" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="button button--primary">
                {editRecord ? "Save changes" : "Create payroll"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Payroll;
