export const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

export const formatDateLabel = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

