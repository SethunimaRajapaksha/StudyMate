import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import FormField from "./FormField";
import Alert from "./Alert";
import SubmitButton from "./SubmitButton";

const COURSE_CODE = /^[A-Z]{2}\d{2}-S\d-[A-Z]{2,3}\d{4}$/;

export default function EditNoteModal({ noteId, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Note eke full details (tags, description) ganna
  useEffect(() => {
    api
      .get(`/notes/${noteId}`)
      .then(({ data }) =>
        setForm({
          title: data.title,
          courseCode: data.courseCode || "",
          subject: data.subject,
          description: data.description || "",
          tags: (data.tags || []).join(", "),
        })
      )
      .catch((err) => setServerError(getErrorMessage(err)));
  }, [noteId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "courseCode" ? value.toUpperCase() : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const found = {};
    if (!form.title.trim()) found.title = "Title is required";
    if (!COURSE_CODE.test(form.courseCode.trim())) {
      found.courseCode = "Course code must look like IN24-S2-IT1207";
    }
    if (!form.subject.trim()) found.subject = "Subject is required";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await api.put(`/notes/${noteId}`, {
        title: form.title.trim(),
        courseCode: form.courseCode.trim(),
        subject: form.subject.trim(),
        description: form.description.trim(),
        tags: form.tags,
      });
      onSaved();
    } catch (err) {
      setServerError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Edit note"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-900">Edit note</h2>
            <p className="mt-1 text-sm text-muted">The PDF file stays the same.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-muted hover:bg-brand-50"
          >
            <X size={20} />
          </button>
        </div>

        {!form && !serverError && (
          <div className="mt-6 space-y-3">
            <div className="h-10 animate-pulse rounded-xl bg-brand-50" />
            <div className="h-10 animate-pulse rounded-xl bg-brand-50" />
            <div className="h-10 animate-pulse rounded-xl bg-brand-50" />
          </div>
        )}

        {!form && serverError && (
          <div className="mt-6">
            <Alert>{serverError}</Alert>
          </div>
        )}

        {form && (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Alert>{serverError}</Alert>

            <FormField
              label="Title"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
            />
            <FormField
              label="Course code"
              id="courseCode"
              name="courseCode"
              placeholder="IN24-S2-IT1207"
              value={form.courseCode}
              onChange={handleChange}
              error={errors.courseCode}
            />
            <FormField
              label="Subject"
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              error={errors.subject}
            />
            <FormField
              label="Tags"
              id="tags"
              name="tags"
              placeholder="exam, week1"
              hint="Separate tags with commas"
              value={form.tags}
              onChange={handleChange}
            />

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-semibold text-brand-900"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <SubmitButton loading={loading}>Save changes</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}