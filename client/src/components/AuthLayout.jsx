import studyMateLogo from "../assets/StudyMate.png";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden flex-col justify-between bg-linear-to-br from-brand-900 via-brand-700 to-brand-500 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white p-2">
            <img src={studyMateLogo} alt="StudyMate" className="h-12 w-12 object-contain" />
          </div>
          <span className="text-2xl font-extrabold">StudyMate</span>
        </div>

        <div>
          <h2 className="text-4xl font-extrabold leading-tight">
            Learn Together,
            <br />
            Succeed Together
          </h2>
          <p className="mt-4 max-w-md text-soft">
            Share lecture notes with your batch, find what you need before exams, and
            build your reputation as a helpful student.
          </p>
        </div>

        <p className="text-sm text-soft">Only verified university students can join.</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src={studyMateLogo} alt="StudyMate" className="h-10 w-10 object-contain" />
            <span className="text-xl font-extrabold">StudyMate</span>
          </div>

          <h1 className="text-3xl font-extrabold text-brand-900">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}