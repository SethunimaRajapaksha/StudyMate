import { Link } from "react-router-dom";
import { Download, User } from "lucide-react";
import StarRating from "./StarRating";

export default function NoteCard({ note }) {
  const rating = note.averageRating || 0;

  return (
    <Link
      to={`/notes/${note._id}`}
      className="group flex flex-col rounded-2xl border border-brand-border bg-white p-5 shadow-sm shadow-brand-900/5 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
    >
      <span className="w-fit rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
        {note.courseCode || "No course code"}
      </span>

      <h3 className="mt-3 line-clamp-2 font-bold text-brand-900 group-hover:text-brand-500">
        {note.title}
      </h3>
      <p className="mt-1 text-sm text-muted">{note.subject}</p>

      <div className="mt-4 flex items-center gap-2">
        <StarRating value={rating} size={14} />
        <span className="text-xs text-muted">
          {note.ratingsCount > 0 ? `${rating.toFixed(1)} (${note.ratingsCount})` : "No ratings yet"}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <User size={14} /> {note.uploader?.name || "Unknown"}
        </span>
        <span className="flex items-center gap-1">
          <Download size={14} /> {note.downloads ?? 0}
        </span>
      </div>
    </Link>
  );
}