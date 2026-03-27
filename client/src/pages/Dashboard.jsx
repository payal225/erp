import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API from "../api/axios";
import "../styles/dashboard.css";
import { useAuth } from "../context/AuthContext";
import {
  ArrowTrendIcon,
  AttendanceIcon,
  ChartIcon,
  MoneyIcon,
  SparkIcon,
  TasksIcon,
  UsersIcon,
} from "../components/Icons";
import { LoadingState, MetricCard, PageHeader, Panel, StatusPill } from "../components/UI";
import { formatCurrency } from "../utils/formatters";

const CHART_COLORS = ["#e4a3b6", "#b8a4d6", "#d4b16d", "#df958d", "#9abfbf", "#d7bad2"];

const tooltipStyle = {
  background: "var(--panel-strong)",
  border: "1px solid var(--border)",
  borderRadius: "18px",
  color: "var(--text)",
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    employees: [],
    attendance: [],
    tasks: [],
    payroll: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [employees, attendance, tasks, payroll] = await Promise.all([
          API.get("/employees"),
          API.get("/attendance"),
          API.get("/tasks"),
          API.get("/payroll"),
        ]);

        setData({
          employees: employees.data,
          attendance: attendance.data,
          tasks: tasks.data,
          payroll: payroll.data,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  const presentToday = data.attendance.filter((item) => item.status === "Present").length;
  const absentToday = data.attendance.filter((item) => item.status === "Absent").length;
  const leaveToday = data.attendance.filter((item) => item.status === "Leave").length;
  const pendingTasks = data.tasks.filter(
    (task) => task.status === "Pending" || task.status === "In Progress"
  ).length;
  const completedTasks = data.tasks.filter((task) => task.status === "Done").length;
  const totalSalary = data.payroll.reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
  const departments = [...new Set(data.employees.map((employee) => employee.department).filter(Boolean))];

  const attendancePie = [
    { name: "Present", value: presentToday },
    { name: "Absent", value: absentToday },
    { name: "Half Day", value: data.attendance.filter((item) => item.status === "Half Day").length },
    { name: "Leave", value: leaveToday },
  ].filter((item) => item.value > 0);

  const taskBar = [
    { name: "Pending", value: data.tasks.filter((task) => task.status === "Pending").length },
    { name: "In Progress", value: data.tasks.filter((task) => task.status === "In Progress").length },
    { name: "Done", value: completedTasks },
  ];

  const payrollBar = data.payroll.map((record) => ({
    name: record.employeeName?.split(" ")[0] || "Team",
    Basic: Number(record.basicSalary || 0),
    Bonus: Number(record.bonus || 0),
    Deductions: Number(record.deductions || 0),
  }));

  const departmentData = data.employees.reduce((accumulator, employee) => {
    const existing = accumulator.find((item) => item.name === employee.department);

    if (existing) {
      existing.value += 1;
    } else if (employee.department) {
      accumulator.push({ name: employee.department, value: 1 });
    }

    return accumulator;
  }, []);

  const topEmployees = data.employees.slice(0, 6);
  const firstName = user?.name?.split(" ")[0] || "team";

  return (
    <div className="content-stack dashboard-page">
      <PageHeader
        
        title={`${getGreeting()}, ${firstName}`}
       
        meta={`${new Date().toDateString()} | ${user?.role === "admin" ? "Admin view" : "Employee view"}`}
        action={
          <StatusPill tone={user?.role === "admin" ? "accent" : "secondary"}>
            <SparkIcon size={14} />
            {user?.role === "admin" ? "Admin" : "Focus"}
          </StatusPill>
        }
      />

      <section className="panel dashboard-hero fade-up">
        <div className="dashboard-hero__copy">
          
          <h2>Key numbers, one screen.</h2>
         
          <div className="dashboard-hero__actions">
            <StatusPill tone="success">{presentToday} present</StatusPill>
            <StatusPill tone="warning">{pendingTasks} open tasks</StatusPill>
            <StatusPill tone="secondary">{departments.length || 0} departments</StatusPill>
          </div>
        </div>

        <div className="dashboard-hero__card">
          <p className="eyebrow">Now</p>
          
          <ul className="stack-list">
            <li>
              <strong>Payroll processed</strong>
              <StatusPill tone="accent">{formatCurrency(totalSalary)}</StatusPill>
            </li>
            <li>
              <strong>Completed work</strong>
              <StatusPill tone="success">{completedTasks} done</StatusPill>
            </li>
            <li>
              <strong>Attendance risk</strong>
              <StatusPill tone={absentToday > 0 ? "danger" : "neutral"}>
                {absentToday > 0 ? `${absentToday} absent` : "On track"}
              </StatusPill>
            </li>
          </ul>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          tone="accent"
          icon={<UsersIcon size={20} />}
          label="Total employees"
          value={data.employees.length}
          hint={`${departments.length || 0} active departments`}
        />
        <MetricCard
          tone="success"
          icon={<AttendanceIcon size={20} />}
          label="Present today"
          value={presentToday}
          hint={`${leaveToday} on leave`}
        />
        <MetricCard
          tone="warning"
          icon={<TasksIcon size={20} />}
          label="Open tasks"
          value={pendingTasks}
          hint={`${completedTasks} completed`}
        />
        <MetricCard
          tone="info"
          icon={<MoneyIcon size={20} />}
          label="Payroll exposure"
          value={formatCurrency(totalSalary)}
          hint={`${data.payroll.length} payroll records`}
        />
      </div>

      <div className="split-grid">
        <Panel title="Attendance mix" subtitle="How the team showed up today">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendancePie} cx="50%" cy="50%" outerRadius={98} dataKey="value" labelLine={false}>
                  {attendancePie.map((item, index) => (
                    <Cell key={`${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Task flow" subtitle="Open vs done">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskBar} barSize={44}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#e4a3b6" radius={[14, 14, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="split-grid">
        <Panel title="Payroll composition" subtitle="Base, bonus, and deductions">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollBar} barSize={16}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="Basic" fill="#b8a4d6" radius={[10, 10, 0, 0]} />
                <Bar dataKey="Bonus" fill="#d4b16d" radius={[10, 10, 0, 0]} />
                <Bar dataKey="Deductions" fill="#df958d" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Department spread" subtitle="Team by department">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentData} cx="50%" cy="50%" innerRadius={64} outerRadius={102} dataKey="value" labelLine={false}>
                  {departmentData.map((item, index) => (
                    <Cell key={`${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="split-grid">
        <Panel title="Operational pulse" subtitle="Key signals this week">
          <div className="summary-list">
            <div className="summary-list__item">
              <div>
                <strong>Attendance stability</strong>
                <p className="table-secondary">Present vs absent</p>
              </div>
              <StatusPill tone={presentToday >= absentToday ? "success" : "danger"}>
                <ArrowTrendIcon size={14} />
                {presentToday >= absentToday ? "Healthy" : "Needs review"}
              </StatusPill>
            </div>
            <div className="summary-list__item">
              <div>
                <strong>Delivery pressure</strong>
                <p className="table-secondary">Open tasks in flight</p>
              </div>
              <StatusPill tone={pendingTasks > completedTasks ? "warning" : "success"}>
                <TasksIcon size={14} />
                {pendingTasks} active
              </StatusPill>
            </div>
            <div className="summary-list__item">
              <div>
                <strong>Team footprint</strong>
                <p className="table-secondary">Headcount by department</p>
              </div>
              <StatusPill tone="secondary">
                <ChartIcon size={14} />
                {departments.length} groups
              </StatusPill>
            </div>
          </div>
        </Panel>

        <Panel title="Team spotlight" subtitle="Quick roster view">
          <div className="summary-list">
            {topEmployees.map((employee) => (
              <div className="summary-list__item" key={employee.id}>
                <div>
                  <strong>{employee.name}</strong>
                  <p className="table-secondary">
                    {employee.department} | {employee.role}
                  </p>
                </div>
                <StatusPill tone={employee.status === "Active" ? "success" : "danger"}>
                  {employee.status}
                </StatusPill>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Employee directory"
        subtitle="Fast roster scan"
        className="table-shell"
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="table-primary">{employee.name}</div>
                  </td>
                  <td>{employee.email}</td>
                  <td>{employee.department}</td>
                  <td>
                    <StatusPill tone="secondary">{employee.role}</StatusPill>
                  </td>
                  <td>
                    <StatusPill tone={employee.status === "Active" ? "success" : "danger"}>
                      {employee.status}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default Dashboard;
