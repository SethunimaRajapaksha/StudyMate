import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api, { getErrorMessage } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/time";
import { getInitials } from "../utils/user";
import Alert from "./Alert";

const MAX = 500;

export default function CommentSection({ noteId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/notes/${noteId}/comments`);
      setComments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const value = text.trim();
    if (!value) {
      setError("Write a comment first.");
      return;
    }

    setPosting(true);
    try {
      const { data } = await api.post(`/notes/${noteId}/comments`, { text: value });
      setComments((prev) => [data, ...prev]);
      setText("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/notes/${noteId}/comments/${id}`);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm shadow-brand-900/5">
      <h2 className="text-lg font-extrabold text-brand-900">
        Comments {comments.length > 0 && <span className="text-muted">({comments.length})</span>}
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <Alert>{error}</Alert>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={3}
          placeholder="Share your thoughts about this note..."
          className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">
            {text.length}/{MAX}
          </span>
          <button
            type="submit"
            disabled={posting}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {posting ? "Posting..." : "Post comment"}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-5">
        {loading ? (
          <p className="text-sm text-muted">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {getInitials(c.user?.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-brand-900">{c.user?.name || "Unknown"}</span>
                  <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
                  {String(c.user?._id) === String(user?.id) && (
                    <button
                      onClick={() => remove(c._id)}
                      aria-label="Delete comment"
                      className="ml-auto rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap text-brand-900">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}