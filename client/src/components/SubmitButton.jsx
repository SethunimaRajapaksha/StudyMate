export default function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}