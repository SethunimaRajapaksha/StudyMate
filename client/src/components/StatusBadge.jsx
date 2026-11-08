const styles = {
  Pending: "bg-amber-100 text-amber-700",
  Fulfilled: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-600",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[status] || styles.Closed}`}
    >
      {status}
    </span>
  );
}