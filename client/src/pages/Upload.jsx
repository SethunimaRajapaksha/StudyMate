import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileText, UploadCloud, X } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import useFetch from "../hooks/useFetch";
import FormField from "../components/FormField";
import Alert from "../components/Alert";
import SubmitButton from "../components/SubmitButton";

const COURSE_CODE = /^[A-Z]{2}\d{2}-S\d-[A-Z]{2,3}\d{4}$/;
const MAX_SIZE = 25 * 1024 * 1024;
const emptyForm = { title: "", courseCode: "", subject: "", description: "", tags: "" };

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function Upload() {
  const inputRef = useRef(null);
  const { data: subjects } = useFetch("/notes/subjects");

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(null);

  const tagList = form.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "courseCode" ? value.toUpperCase() : value });
  };

  const pickFile = (f) => {
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      setErrors((prev) => ({ ...prev, file: "Only PDF files are allowed" }));
      return;
    }
    if (f.size > MAX_SIZE) {
      setFile(null);
      setErrors((prev) => ({ ...prev, file: "File is too large (max 25MB)" }));
      return;
    }
    setFile(f);
    setErrors((prev) => ({ ...prev, file: "" }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const validate = () => {
    const e = {};
    if (!file) e.file = "Please choose a PDF file";
    if (!form.title.trim()) e.title = "Title is required";
    if (!COURSE_CODE.test(form.courseCode.trim())) {
      e.courseCode = "Course code must look like IN24-S2-IT1207";
    }
    if (!form.subject.trim()) e.subject = "Subject is required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("courseCode", form.courseCode.trim());
    fd.append("subject", form.subject.trim());
    fd.append("description", form.description.trim());
    fd.append("tags", tagList.join(","));
    fd.append("file", file);

    setLoading(true);
    setProgress(0);
    try {
      const { data } = await api.post("/notes", fd, {
        onUploadProgress: (e) => {
          const total = e.total || file.size;
          setProgress(Math.min(100, Math.round((e.loaded * 100) / total)));
        },
      });
      setUploaded(data);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setFile(null);
    setErrors({});
    setServerError("");
    setProgress(0);
    setUploaded(null);
  };

  if (uploaded) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-brand-border bg-white p-10 text-center shadow-sm shadow-brand-900/5">
        <CheckCircle2 size={56} className="mx-auto text-green-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-brand-900">Note uploaded!</h1>
        <p className="mt-2 text-muted">
          <span className="font-semibold text-brand-900">{uploaded.title}</span> ({uploaded.courseCode})
          is now available to everyone.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            Upload another
          </button>
          <Link
            to="/explore"
            className="rounded-xl border border-brand-border px-6 py-3 text-sm font-bold text-brand-700 hover:border-brand-500"
          >
            Browse notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-brand-900">Upload Notes</h1>
      <p className="mt-1 text-muted">Share a PDF with your batch. Maximum size 25MB.</p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 space-y-6 rounded-3xl border border-brand-border bg-white p-6 shadow-sm shadow-brand-900/5 sm:p-8"
      >
        <Alert>{serverError}</Alert>

        {/* Drop zone */}
        <div>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragging
                ? "border-brand-500 bg-brand-50"
                : errors.file
                ? "border-red-400"
                : "border-brand-border hover:border-brand-500 hover:bg-brand-50/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {file ? (
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <span className="rounded-xl bg-brand-50 p-3 text-brand-500">
                  <FileText size={24} />
                </span>
                <div className="text-left">
                  <p className="max-w-xs truncate font-bold text-brand-900">{file.name}</p>
                  <p className="text-xs text-muted">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label="Remove file"
                  className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud size={40} className="text-brand-500" />
                <p className="mt-3 font-bold text-brand-900">Drag and drop your PDF here</p>
                <p className="text-sm text-muted">or click to browse (PDF only, max 25MB)</p>
              </>
            )}
          </div>
          {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormField
              label="Title"
              id="title"
              name="title"
              placeholder="e.g. Data Structures Week 1 Notes"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
            />
          </div>

          <FormField
            label="Course code"
            id="courseCode"
            name="courseCode"
            placeholder="IN24-S2-IT1207"
            hint="Format: IN24-S2-IT1207"
            value={form.courseCode}
            onChange={handleChange}
            error={errors.courseCode}
          />

          <div>
            <FormField
              label="Subject"
              id="subject"
              name="subject"
              list="subject-options"
              placeholder="e.g. Data Structures"
              value={form.subject}
              onChange={handleChange}
              error={errors.subject}
            />
            <datalist id="subject-options">
              {(subjects || []).map((s) => (
                <option key={s.subject} value={s.subject} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <FormField
              label="Tags (optional)"
              id="tags"
              name="tags"
              placeholder="exam, week1, past paper"
              hint="Separate tags with commas"
              value={form.tags}
              onChange={handleChange}
            />
            {tagList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tagList.map((t) => (
                  <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    #{t.toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-brand-900">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What does this note cover?"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>

        {loading && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-50">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {progress < 100 ? `Uploading... ${progress}%` : "Processing..."}
            </p>
          </div>
        )}

        <SubmitButton loading={loading}>Upload note</SubmitButton>
      </form>
    </div>
  );
}