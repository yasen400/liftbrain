export default function SettingsPage() {
  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Profile</p>
        <h1 className="text-3xl font-semibold text-gray-900">Account & goals</h1>
        <p className="text-gray-600">Profile editing, schedule, and equipment inputs will persist to Prisma shortly.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Training schedule</h2>
          <p className="text-sm text-gray-500">Weekly frequency, minutes per session.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Equipment</h2>
          <p className="text-sm text-gray-500">Toggle available gear to help the AI coach stay realistic.</p>
        </div>
      </div>
    </section>
  );
}
