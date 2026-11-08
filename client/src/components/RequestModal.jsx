import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import FormField from "./FormField";
import Alert from "./Alert";
import SubmitButton from "./SubmitButton";

const COURSE_CODE = /^[A-Z]{2}\d{2}-S\d-[A-Z]{2,3}\d{4}$/;

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function RequestModal({ note, onClose }) {
  const uploader = note.uploader;
  const minDate = tomorrow();

  const [form, setForm] = useState({
    targetCourseCode: note.courseCode || "",
    topicDescription: "",
    deadline: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Esc ebuwama close wenawa
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "targetCourseCode" ? value.toUpperCase() : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const found = {};
    if (!COURSE_CODE.test(form.targetCourseCode.trim())) {
      found.targetCourseCode = "Course code must look like IN24-S2-IT1207";
    }
    if (!form.topicDescription.trim()) found.topicDescription = "Describe what you need";
    if (!form.deadline) found.deadline = "Choose a deadline";
    else if (form.deadline < minDate) found.deadline = "Deadline must be in the future";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await api.post("/requests", {
        targetUploaderId: uploader._id,
        targetCourseCode: form.targetCourseCode.trim(),
        topicDescription: form.topicDescription.trim(),
        deadline: form.deadline,
      });
      setSent(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Request notes"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {sent ? (
          <div className="text-center">
            <CheckCircle2 size={56} className="mx-auto text-green-500" />
            <h2 className="mt-4 text-2xl font-extrabold text-brand-900">Request sent!</h2>
            <p className="mt-2 text-muted">
              {uploader?.name} will be notified and will see your request on their dashboard.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-brand-500 px-8 py-3 text-sm font-bold text-white hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-brand-900">Request notes</h2>
                <p className="mt-1 text-sm text-muted">
                  Ask <span className="font-semibold text-brand-900">{uploader?.name}</span> for
                  more notes.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 text-muted hover:bg-brand-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <Alert>{serverError}</Alert>

              <FormField
                label="Course code"
                id="targetCourseCode"
                name="targetCourseCode"
                placeholder="IN24-S2-IT1207"
                value={form.targetCourseCode}
                onChange={handleChange}
                error={errors.targetCourseCode}
              />

              <div>
                <label
                  htmlFor="topicDescription"
                  className="mb-1.5 block text-sm font-semibold text-brand-900"
                >
                  What do you need?
                </label>
                <textarea
                  id="topicDescription"
                  name="topicDescription"
                  rows={3}
                  placeholder="e.g. Week 5 lecture notes on sorting algorithms"
                  value={form.topicDescription}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/30 ${
                    errors.topicDescription
                      ? "border-red-400"
                      : "border-brand-border focus:border-brand-500"
                  }`}
                />
                {errors.topicDescription && (
                  <p className="mt-1 text-xs text-red-600">{errors.topicDescription}</p>
                )}
              </div>

              <FormField
                label="Needed by"
                id="deadline"
                name="deadline"
                type="date"
                min={minDate}
                value={form.deadline}
                onChange={handleChange}
                error={errors.deadline}
              />

              <SubmitButton loading={loading}>Send request</SubmitButton>
            </form>
          </>
        )}
      </div>
    </div>
  );
}