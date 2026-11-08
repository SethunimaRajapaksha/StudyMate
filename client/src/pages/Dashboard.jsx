import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  Download,
  Eye,
  FileText,
  Inbox,
  Pencil,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import StarRating from "../components/StarRating";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import EditNoteModal from "../components/EditNoteModal";
import Alert from "../components/Alert";
import { timeAgo } from "../utils/time";
import { deadlineLabel, formatFullDate } from "../utils/deadline";

const card = "rounded-2xl border border-brand-border bg-white shadow-sm shadow-brand-900/5";
const TABS = ["uploads", "incoming", "sent"];

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "uploads";

  const [stats, setStats] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [closingReq, setClosingReq] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [s, i, se] = await Promise.all([
        api.get("/users/me/stats"),
        api.get("/requests/incoming"),
        api.get("/requests/sent"),
      ]);
      setStats(s.data);
      setIncoming(i.data);
      setSent(se.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setTab = (key) => setParams(key === "uploads" ? {} : { tab: key }, { replace: true });

  const confirmDelete = async () => {
    setBusy(true);
    setActionError("");
    try {
      await api.delete(`/notes/${deleting._id}`);
      setDeleting(null);
      await loadAll();
    } catch (err) {
      setActionError(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (id, status) => {
    setBusyId(id);
    setActionError("");
    try {
      await api.patch(`/requests/${id}/status`, { status });
      await loadAll();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`${card} mx-auto max-w-md p-8 text-center`}>
        <p className="font-bold text-brand-900">Could not load your dashboard</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            loadAll();
          }}
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const pendingCount = incoming.filter((r) => r.status === "Pending").length;
  const urgentCount = incoming.filter((r) => r.isUrgent).length;

  const statItems = [
    { label: "Notes uploaded", value: stats.uploadsCount, icon: FileText },
    { label: "Total downloads", value: stats.totalDownloads, icon: Download },
    { label: "Avg. rating", value: stats.overallAverageRating.toFixed(1), icon: Star },
    { label: "Reputation points", value: stats.user.reputationPoints, icon: Award },
    { label: "Pending requests", value: pendingCount, icon: Inbox },
  ];

  const tabs = [
    { key: "uploads", label: "My Uploads", count: stats.notes.length },
    { key: "incoming", label: "Incoming Requests", count: pendingCount, alert: urgentCount > 0 },
    { key: "sent", label: "Sent Requests", count: sent.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">My Dashboard</h1>
        <p className="mt-1 text-muted">Track your uploads and manage note requests.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${card} p-5`}>
            <span className="inline-flex rounded-xl bg-brand-50 p-2.5 text-brand-500">
              <Icon size={20} />
            </span>
            <p className="mt-3 text-3xl font-extrabold text-brand-900">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
          <AlertTriangle size={20} className="text-amber-600" />
          <p className="flex-1 text-sm font-semibold text-amber-800">
            {urgentCount} request{urgentCount > 1 ? "s need" : " needs"} your attention soon.
          </p>
          {tab !== "incoming" && (
            <button
              onClick={() => setTab("incoming")}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
            >
              View requests
            </button>
          )}
        </div>
      )}

      <Alert>{actionError}</Alert>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-brand-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition ${
              tab === t.key
                ? "border-brand-500 text-brand-900"
                : "border-transparent text-muted hover:text-brand-900"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                t.alert
                  ? "bg-amber-100 text-amber-700"
                  : tab === t.key
                  ? "bg-brand-500 text-white"
                  : "bg-brand-50 text-brand-700"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "uploads" && (
        <UploadsTab notes={stats.notes} onEdit={setEditingId} onDelete={setDeleting} />
      )}
      {tab === "incoming" && (
        <IncomingTab
          requests={incoming}
          busyId={busyId}
          onStatus={updateStatus}
          onClose={setClosingReq}
        />
      )}
      {tab === "sent" && <SentTab requests={sent} />}

      {editingId && (
        <EditNoteModal
          noteId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            loadAll();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          danger
          loading={busy}
          title="Delete this note?"
          message={`"${deleting.title}" will be permanently removed along with its PDF, ratings and comments. Reputation points earned from it will also be removed.`}
          confirmLabel="Delete note"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {closingReq && (
        <ConfirmDialog
          danger
          title="Close this request?"
          message={`The request from ${closingReq.requesterId?.name || "this student"} for ${closingReq.targetCourseCode} will be marked as closed and they will be notified.`}
          confirmLabel="Close request"
          onConfirm={() => {
            const id = closingReq._id;
            setClosingReq(null);
            updateStatus(id, "Closed");
          }}
          onCancel={() => setClosingReq(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className={`${card} p-12 text-center`}>
      <span className="mx-auto inline-flex rounded-2xl bg-brand-50 p-4 text-brand-500">
        <Icon size={28} />
      </span>
      <p className="mt-4 font-bold text-brand-900">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
      {action}
    </div>
  );
}

function UploadsTab({ notes, onEdit, onDelete }) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No uploads yet"
        text="Share your first note with your batch."
        action={
          <Link
            to="/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            <Upload size={16} /> Upload a note
          </Link>
        }
      />
    );
  }

  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border text-xs tracking-wide text-muted uppercase">
            <th className="px-5 py-3 font-semibold">Note</th>
            <th className="px-5 py-3 font-semibold">Course</th>
            <th className="px-5 py-3 font-semibold">Rating</th>
            <th className="px-5 py-3 font-semibold">Downloads</th>
            <th className="px-5 py-3 font-semibold">Uploaded</th>
            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((n) => (
            <tr key={n._id} className="border-b border-brand-border last:border-0 hover:bg-brand-50/50">
              <td className="px-5 py-4">
                <Link
                  to={`/notes/${n._id}`}
                  className="font-bold text-brand-900 hover:text-brand-500"
                >
                  {n.title}
                </Link>
                <p className="text-xs text-muted">{n.subject}</p>
              </td>
              <td className="px-5 py-4">
                <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                  {n.courseCode || "–"}
                </span>
              </td>
              <td className="px-5 py-4">
                {n.ratingsCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <StarRating value={n.averageRating} size={14} />
                    <span className="text-xs text-muted">
                      {n.averageRating.toFixed(1)} ({n.ratingsCount})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted">No ratings yet</span>
                )}
              </td>
              <td className="px-5 py-4 font-semibold text-brand-900">{n.downloads}</td>
              <td className="px-5 py-4 text-muted">{formatFullDate(n.createdAt)}</td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/notes/${n._id}`}
                    aria-label="View note"
                    className="rounded-lg p-2 text-muted hover:bg-brand-50 hover:text-brand-500"
                  >
                    <Eye size={18} />
                  </Link>
                  <button
                    onClick={() => onEdit(n._id)}
                    aria-label="Edit note"
                    className="rounded-lg p-2 text-muted hover:bg-brand-50 hover:text-brand-500"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(n)}
                    aria-label="Delete note"
                    className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FILTERS = ["Pending", "Fulfilled", "Closed", "All"];

function IncomingTab({ requests, busyId, onStatus, onClose }) {
  const [filter, setFilter] = useState("Pending");

  const count = (f) => (f === "All" ? requests.length : requests.filter((r) => r.status === f).length);
  const list = filter === "All" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              filter === f
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-brand-border bg-white text-brand-700 hover:border-brand-500"
            }`}
          >
            {f} <span className={filter === f ? "text-white/70" : "text-muted"}>{count(f)}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === "Pending" ? "No pending requests" : `No ${filter.toLowerCase()} requests`}
          text="When a student requests notes from you, it will show up here."
        />
      ) : (
        list.map((r) => {
          const isPending = r.status === "Pending";
          const busy = busyId === r._id;

          return (
            <div
              key={r._id}
              className={`${card} p-5 ${
                isPending && r.isOverdue
                  ? "border-red-300"
                  : isPending && r.isUrgent
                  ? "border-amber-300"
                  : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                  {r.targetCourseCode}
                </span>
                <StatusBadge status={r.status} />
                {isPending && r.isOverdue && (
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                    Overdue
                  </span>
                )}
                {isPending && r.isUrgent && !r.isOverdue && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    Urgent
                  </span>
                )}
                <span
                  className={`ml-auto text-sm font-semibold ${
                    isPending && r.isOverdue
                      ? "text-red-600"
                      : isPending && r.isUrgent
                      ? "text-amber-600"
                      : "text-muted"
                  }`}
                >
                  {isPending ? deadlineLabel(r.deadline) : `Needed by ${formatFullDate(r.deadline)}`}
                </span>
              </div>

              <p className="mt-3 text-brand-900">{r.topicDescription}</p>
              <p className="mt-2 text-xs text-muted">
                From <span className="font-semibold">{r.requesterId?.name || "a student"}</span>
                {r.requesterId?.indexNumber ? ` (${r.requesterId.indexNumber})` : ""} · Requested{" "}
                {timeAgo(r.createdAt)} · Needed by {formatFullDate(r.deadline)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {isPending ? (
                  <>
                    <Link
                      to={`/upload?courseCode=${encodeURIComponent(r.targetCourseCode)}`}
                      className="flex items-center gap-2 rounded-xl border border-brand-500 px-4 py-2 text-sm font-bold text-brand-500 hover:bg-brand-50"
                    >
                      <Upload size={16} /> Upload notes
                    </Link>
                    <button
                      onClick={() => onStatus(r._id, "Fulfilled")}
                      disabled={busy}
                      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {busy ? "Saving..." : "Mark as fulfilled"}
                    </button>
                    <button
                      onClick={() => onClose(r)}
                      disabled={busy}
                      className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onStatus(r._id, "Pending")}
                    disabled={busy}
                    className="rounded-xl border border-brand-border px-4 py-2 text-sm font-bold text-brand-700 hover:border-brand-500 disabled:opacity-60"
                  >
                    {busy ? "Saving..." : "Reopen"}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function SentTab({ requests }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="You haven't sent any requests"
        text="Open a note and use 'Request notes' to ask its uploader for more."
        action={
          <Link
            to="/explore"
            className="mt-5 inline-block rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Explore notes
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <div key={r._id} className={`${card} p-5`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
              {r.targetCourseCode}
            </span>
            <StatusBadge status={r.status} />
            <span className="ml-auto text-sm text-muted">
              {r.status === "Pending" ? deadlineLabel(r.deadline) : `Needed by ${formatFullDate(r.deadline)}`}
            </span>
          </div>

          <p className="mt-3 text-brand-900">{r.topicDescription}</p>
          <p className="mt-2 text-xs text-muted">
            To <span className="font-semibold">{r.targetUploaderId?.name || "an uploader"}</span>
            {r.targetUploaderId?.indexNumber ? ` (${r.targetUploaderId.indexNumber})` : ""} · Sent{" "}
            {timeAgo(r.createdAt)} · Needed by {formatFullDate(r.deadline)}
          </p>
        </div>
      ))}
    </div>
  );
}