import {
  AttendanceIcon,
  DashboardIcon,
  LeaveIcon,
  PayrollIcon,
  TasksIcon,
  UsersIcon,
} from "./Icons";

export const navigationLinks = [
  {
    to: "/dashboard",
    label: "Dashboard",
    description: "Team, tasks, and payroll at a glance.",
    icon: DashboardIcon,
  },
  {
    to: "/employees",
    label: "Employees",
    description: "People, roles, and status.",
    icon: UsersIcon,
  },
  {
    to: "/attendance",
    label: "Attendance",
    description: "Daily presence and timings.",
    icon: AttendanceIcon,
  },
  {
    to: "/leave",
    label: "Leave",
    description: "Requests, approvals, and status.",
    icon: LeaveIcon,
  },
  {
    to: "/tasks",
    label: "Tasks",
    description: "Owners, deadlines, and progress.",
    icon: TasksIcon,
  },
  {
    to: "/payroll",
    label: "Payroll",
    description: "Pay runs and payslips.",
    icon: PayrollIcon,
  },
];

export const routeMeta = navigationLinks.reduce((meta, link) => {
  meta[link.to] = {
    title: link.label,
    description: link.description,
  };

  return meta;
}, {});
