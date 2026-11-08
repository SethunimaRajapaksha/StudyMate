import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, HandHelping, Tag } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/user";
import StarRating from "../components/StarRating";
import StarInput from "../components/StarInput";
import CommentSection from "../components/CommentSection";
import RequestModal from "../components/RequestModal";
import Alert from "../components/Alert";

const card = "rounded-2xl border border-brand-border bg-white p-5 shadow-sm shadow-brand-900/5";

export default function NoteHub() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [note, setNote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(false);
  const [rateMsg, setRateMsg] = useState({ type: "", text: "" });
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/notes/${id}`)
      .then((res) => setNote(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = async () => {
    const { data } = await api.get(`/notes/${id}`);
    setNote(data);
  };

  const handleRate = async (value) => {
    setRating(true);
    setRateMsg({ type: "", text: "" });
    try {
      await api.post(`/notes/${id}/rate`, { value });
      await refresh();
      setRateMsg({
        type: "success",
        text: `You rated this note ${value} star${value > 1 ? "s" : ""}.`,
      });
    } catch (err) {
      setRateMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setRating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setActionError("");
    try {
      const { data } = await api.get(`/notes/${id}/download`);
      setNote((n) => ({ ...n, downloads: data.downloads }));

      try {
        const res = await fetch(data.fileUrl);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${note.courseCode}_${note.title}.pdf`.replace(/[^\w.-]+/g, "_");
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        // Direct download wada karanne nathnam new tab ekaka open karanawa
        window.open(data.fileUrl, "_blank", "noopener");
      }
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-white" />
        <div className="h-[60vh] animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className={`${card} mx-auto max-w-md text-center`}>
        <p className="font-bold text-brand-900">Could not open this note</p>
        <p className="mt-1 text-sm text-muted">{error || "Note not found"}</p>
        <Link
          to="/explore"
          className="mt-4 inline-block rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const isOwner = String(note.uploader?._id) === String(user?.id);
  const uploaderFirstName = note.uploader?.name?.split(" ")[0] || "the uploader";
  const average = note.averageRating || 0;
  const uploadedOn = new Date(note.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-700"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <header>
            <span className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              {note.courseCode || "No course code"}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-brand-900">{note.title}</h1>
            <p className="mt-1 text-muted">
              {note.subject} · Uploaded {uploadedOn}
            </p>
            {note.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Tag size={14} className="text-muted" />
                {note.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/explore?tags=${encodeURIComponent(t)}`}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-border hover:ring-brand-500"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* PDF preview */}
          <div className="overflow-hidden rounded-2xl border border-brand-border bg-white">
            <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
              <span className="font-bold text-brand-900">Preview</span>
              <a
                href={note.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-700"
              >
                <ExternalLink size={14} /> Open in new tab
              </a>
            </div>
            <iframe
              title={`Preview of ${note.title}`}
              src={`${note.fileUrl}#view=FitH`}
              className="h-[70vh] w-full"
            />
          </div>

          {note.description && (
            <section className={card}>
              <h2 className="font-extrabold text-brand-900">About this note</h2>
              <p className="mt-2 text-sm whitespace-pre-wrap text-muted">{note.description}</p>
            </section>
          )}

          <CommentSection noteId={note._id} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Download */}
          <div className={card}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-700 disabled:opacity-60"
            >
              <Download size={18} />
              {downloading ? "Preparing..." : "Download PDF"}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              {note.downloads ?? 0} {note.downloads === 1 ? "download" : "downloads"}
            </p>
            <div className="mt-3">
              <Alert>{actionError}</Alert>
            </div>
          </div>

          {/* Rating */}
          <div className={card}>
            <h3 className="font-extrabold text-brand-900">Ratings</h3>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-5xl font-extrabold text-brand-900">
                {note.ratingsCount > 0 ? average.toFixed(1) : "–"}
              </span>
              <div>
                <StarRating value={average} size={18} />
                <p className="mt-1 text-xs text-muted">
                  {note.ratingsCount} {note.ratingsCount === 1 ? "rating" : "ratings"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = note.ratingBreakdown?.[n] || 0;
                const pct = note.ratingsCount ? (count / note.ratingsCount) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted">{n}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-50">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-5 text-right text-muted">{count}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 border-t border-brand-border pt-4">
              {isOwner ? (
                <p className="text-sm text-muted">This is your note, so you can't rate it.</p>
              ) : (
                <>
                  <p className="mb-2 text-sm font-semibold text-brand-900">
                    {note.myRating ? "Your rating" : "Rate this note"}
                  </p>
                  <StarInput value={note.myRating || 0} onChange={handleRate} disabled={rating} />
                  {rateMsg.text && (
                    <div className="mt-3">
                      <Alert type={rateMsg.type}>{rateMsg.text}</Alert>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Uploader + request */}
          <div className={card}>
            <h3 className="font-extrabold text-brand-900">Uploaded by</h3>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 font-bold text-white">
                {getInitials(note.uploader?.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-brand-900">{note.uploader?.name}</p>
                <p className="truncate text-xs text-muted">{note.uploader?.indexNumber}</p>
              </div>
            </div>

            {isOwner ? (
              <p className="mt-4 text-sm text-muted">You uploaded this note.</p>
            ) : (
              <button
                onClick={() => setShowRequest(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500 py-3 text-sm font-bold text-brand-500 transition hover:bg-brand-50"
              >
                <HandHelping size={18} />
                Request notes from {uploaderFirstName}
              </button>
            )}
          </div>
        </aside>
      </div>

      {showRequest && <RequestModal note={note} onClose={() => setShowRequest(false)} />}
    </div>
  );
}