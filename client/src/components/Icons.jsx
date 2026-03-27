import {
  BadgeIndianRupee,
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  Clock3,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  MoonStar,
  Pencil,
  Plus,
  Printer,
  Search,
  Sparkles,
  SunMedium,
  Trash2,
  TrendingUp,
  TriangleAlert,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

const withDefaults = (Icon) => {
  const WrappedIcon = ({ size = 20, strokeWidth = 1.9, ...props }) => (
    <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} {...props} />
  );

  WrappedIcon.displayName = `Icon${Icon.displayName || Icon.name || "Component"}`;

  return WrappedIcon;
};

export const BrandMark = ({ size = 20, strokeWidth = 1.9, ...props }) => (
  <span
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      display: "inline-grid",
      placeItems: "center",
      position: "relative",
    }}
    {...props}
  >
    <Building2
      size={size}
      strokeWidth={strokeWidth}
      style={{ position: "absolute", inset: 0 }}
    />
    <Sparkles
      size={Math.max(8, Math.round(size * 0.42))}
      strokeWidth={2.1}
      style={{
        position: "absolute",
        right: Math.max(-1, Math.round(size * -0.04)),
        top: Math.max(-2, Math.round(size * -0.08)),
      }}
    />
  </span>
);
export const DashboardIcon = withDefaults(LayoutDashboard);
export const UsersIcon = withDefaults(UsersRound);
export const AttendanceIcon = withDefaults(CalendarClock);
export const LeaveIcon = withDefaults(CalendarRange);
export const TasksIcon = withDefaults(ListTodo);
export const PayrollIcon = withDefaults(WalletCards);
export const MenuIcon = withDefaults(Menu);
export const CloseIcon = withDefaults(X);
export const LogoutIcon = withDefaults(LogOut);
export const SunIcon = withDefaults(SunMedium);
export const MoonIcon = withDefaults(MoonStar);
export const SearchIcon = withDefaults(Search);
export const PlusIcon = withDefaults(Plus);
export const EditIcon = withDefaults(Pencil);
export const TrashIcon = withDefaults(Trash2);
export const PrintIcon = withDefaults(Printer);
export const ChartIcon = withDefaults(BarChart3);
export const SparkIcon = withDefaults(Sparkles);
export const CheckIcon = withDefaults(Check);
export const ClockIcon = withDefaults(Clock3);
export const AlertIcon = withDefaults(TriangleAlert);
export const ArrowTrendIcon = withDefaults(TrendingUp);
export const CalendarIcon = withDefaults(CalendarDays);
export const MoneyIcon = withDefaults(BadgeIndianRupee);
