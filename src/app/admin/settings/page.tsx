export default function AdminSettings() {
  return (
    <div>
      <h1 className="text-xl font-bold text-brand-navy">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Not wired up yet — a placeholder for whenever platform-level config needs a UI.</p>

      <div className="mt-5 max-w-lg space-y-4 rounded-xl border border-black/5 bg-white p-6 shadow-sm opacity-60">
        <div>
          <label className="block text-sm font-medium text-gray-700">Platform name</label>
          <input disabled defaultValue="Cargoxo" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Support email</label>
          <input disabled defaultValue="support@cargoxo.com" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <button disabled className="cursor-not-allowed rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-white">
          Save
        </button>
      </div>
    </div>
  );
}
