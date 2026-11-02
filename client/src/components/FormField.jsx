import { useState } from "react";

export default function FormField({ label, id, error, hint, type = "text", ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-brand-900">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          {...props}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/30 ${
            isPassword ? "pr-16" : ""
          } ${error ? "border-red-400" : "border-brand-border focus:border-brand-500"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-brand-500 hover:text-brand-700"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}