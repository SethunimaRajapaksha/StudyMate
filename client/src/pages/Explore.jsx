import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Search, X } from "lucide-react";
import useFetch from "../hooks/useFetch";
import NoteCard from "../components/NoteCard";

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const subject = params.get("subject") || "";
  const tagsParam = params.get("tags") || "";
  const sort = params.get("sort") || "newest";
  const tags = tagsParam ? tagsParam.split(",") : [];

  const [search, setSearch] = useState(q);

  // Top bar eken search karama input eka update wenawa
  useEffect(() => {
    setSearch(q);
  }, [q]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next, { replace: true });
  };

  // Type karala 0.4s passe search karanawa
  useEffect(() => {
    const id = setTimeout(() => {
      if (search.trim() !== q) update({ q: search.trim() });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleTag = (tag) => {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    update({ tags: next.join(",") });
  };

  const clearAll = () => {
    setSearch("");
    setParams({}, { replace: true });
  };

  const filters = {};
  if (q) filters.q = q;
  if (subject) filters.subject = subject;
  if (tags.length) filters.tag = tags.join(",");
  if (sort === "popular") filters.sort = "popular";

  const { data: notes, loading, error } = useFetch("/notes", filters);
  const { data: subjects } = useFetch("/notes/subjects");
  const { data: tagList } = useFetch("/notes/tags");

  const hasFilters = q || subject || tags.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Explore Notes</h1>
        <p className="mt-1 text-muted">Search by title, course code or tag, or browse by subject.</p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, e.g. IN24-S2-IT1207"
            className="w-full rounded-xl border border-brand-border bg-white py-3 pr-4 pl-11 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}
          className="rounded-xl border border-brand-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-brand-500"
        >
          <option value="newest">Newest first</option>
          <option value="popular">Most popular</option>
        </select>
      </div>

      {/* Subject cards */}
      {subjects && subjects.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-extrabold text-brand-900">Browse by subject</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subjects.map((s) => {
              const active = subject.toLowerCase() === s.subject.toLowerCase();
              return (
                <button
                  key={s.subject}
                  onClick={() => update({ subject: active ? "" : s.subject })}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/30"
                      : "border-brand-border bg-white hover:-translate-y-0.5 hover:border-brand-500"
                  }`}
                >
                  <span className={`rounded-xl p-2.5 ${active ? "bg-white/20" : "bg-brand-50 text-brand-500"}`}>
                    <BookOpen size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{s.subject}</span>
                    <span className={`text-xs ${active ? "text-white/80" : "text-muted"}`}>
                      {s.count} {s.count === 1 ? "note" : "notes"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Tag chips */}
      {tagList && tagList.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-extrabold text-brand-900">Filter by tags</h2>
          <div className="flex flex-wrap gap-2">
            {tagList.map((t) => {
              const active = tags.includes(t.tag);
              return (
                <button
                  key={t.tag}
                  onClick={() => toggleTag(t.tag)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-brand-border bg-white text-brand-700 hover:border-brand-500"
                  }`}
                >
                  #{t.tag} <span className={active ? "text-white/70" : "text-muted"}>{t.count}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Filters:</span>
          {q && <Chip label={`"${q}"`} onRemove={() => { setSearch(""); update({ q: "" }); }} />}
          {subject && <Chip label={subject} onRemove={() => update({ subject: "" })} />}
          {tags.map((t) => (
            <Chip key={t} label={`#${t}`} onRemove={() => toggleTag(t)} />
          ))}
          <button onClick={clearAll} className="text-sm font-semibold text-brand-500 hover:text-brand-700">
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      <section>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-white p-10 text-center">
            <p className="font-bold text-brand-900">No notes found</p>
            <p className="mt-1 text-sm text-muted">
              {hasFilters ? "Try different keywords or remove some filters." : "Be the first to upload a note!"}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="mt-4 rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">
              {notes.length} {notes.length === 1 ? "note" : "notes"} found
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => (
                <NoteCard key={note._id} note={note} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="hover:text-brand-900">
        <X size={14} />
      </button>
    </span>
  );
}