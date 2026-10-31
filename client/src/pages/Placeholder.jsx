import { useAuth } from "../context/AuthContext";

export default function Placeholder({ title }) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold text-brand-900">{title}</h1>
      {isAuthenticated && (
        <>
          <p className="mt-2 text-muted">Logged in as {user?.name}</p>
          <button
            onClick={logout}
            className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-white hover:bg-brand-700"
          >
            Log out
          </button>
        </>
      )}
    </div>
  );
}