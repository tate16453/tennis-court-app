"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";

const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Court = { id: string; number: number; name: string; locationId: string; location: { name: string; displayName: string } };
type Location = { id: string; name: string; displayName: string; courts: Court[] };
type ClassSession = { id: string; date: string; isActive: boolean; reservations: { id: string; firstName: string; lastName: string; nickname?: string; lineUserId?: string }[] };
type ClassSchedule = {
  id: string; title: string; dayOfWeek: number; startTime: string; endTime: string;
  maxParticipants: number; isActive: boolean;
  coach: { firstName: string; lastName: string };
  court: { id: string; number: number; name: string; location: { name: string; displayName: string } };
  sessions: ClassSession[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"classes" | "add">("classes");
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newClass, setNewClass] = useState({
    title: "", courtId: "", dayOfWeek: 1, startTime: "09:00", endTime: "10:30", maxParticipants: 6,
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && role === "CUSTOMER") router.push("/");
  }, [status, role, router]);

  const fetchData = () => {
    Promise.all([
      fetch("/api/classes/dashboard").then(r => r.json()),
      fetch("/api/courts").then(r => r.json()),
    ]).then(([cls, locs]) => {
      setClasses(cls);
      setLocations(locs);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const toggleSession = async (classScheduleId: string, date: string, isActive: boolean) => {
    await fetch("/api/classes/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classScheduleId, date, isActive }),
    });
    fetchData();
  };

  const addClass = async () => {
    setAddError("");
    setAddLoading(true);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClass),
    });
    const data = await res.json();
    setAddLoading(false);
    if (!res.ok) {
      setAddError(data.error || "Failed to create class");
    } else {
      // Auto-create sessions for next 4 weeks
      const today = new Date();
      for (let week = 0; week < 4; week++) {
        const d = new Date(today);
        const daysUntil = (newClass.dayOfWeek - today.getDay() + 7) % 7 + week * 7;
        d.setDate(today.getDate() + daysUntil);
        await fetch("/api/classes/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classScheduleId: data.id, date: d.toISOString().split("T")[0], isActive: true }),
        });
      }
      setActiveTab("classes");
      setNewClass({ title: "", courtId: "", dayOfWeek: 1, startTime: "09:00", endTime: "10:30", maxParticipants: 6 });
      fetchData();
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Coach Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage class schedules and view registrations</p>
        </div>
        <div className="text-sm text-slate-500 text-right sm:text-left">
          Logged in as: <span className="font-medium text-slate-700">{(session?.user as any)?.firstName}</span>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
            {role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("classes")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "classes" ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-green-400"}`}>
          Class Schedules ({classes.length})
        </button>
        <button onClick={() => setActiveTab("add")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "add" ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-green-400"}`}>
          + Add New Class
        </button>
      </div>

      {activeTab === "add" && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 max-w-full sm:max-w-lg">
          <h2 className="font-bold text-slate-800 mb-4">Create New Class Schedule</h2>
          {addError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{addError}</div>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Class Title *</label>
              <input type="text" value={newClass.title} onChange={e => setNewClass(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Beginner Tennis"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Court *</label>
              <select value={newClass.courtId} onChange={e => setNewClass(f => ({ ...f, courtId: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select court...</option>
                {locations.map(loc => (
                  <optgroup key={loc.id} label={loc.displayName}>
                    {loc.courts.map(c => (
                      <option key={c.id} value={c.id}>{loc.displayName} — Court {c.number}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Day of Week *</label>
              <select value={newClass.dayOfWeek} onChange={e => setNewClass(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                <input type="time" value={newClass.startTime} onChange={e => setNewClass(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                <input type="time" value={newClass.endTime} onChange={e => setNewClass(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max Participants</label>
              <input type="number" min={1} max={20} value={newClass.maxParticipants}
                onChange={e => setNewClass(f => ({ ...f, maxParticipants: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button onClick={addClass} disabled={addLoading || !newClass.title || !newClass.courtId}
              className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {addLoading ? "Creating..." : "Create Class & Generate 4 Sessions"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "classes" && (
        <div className="space-y-4">
          {classes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">No classes yet.</div>
          ) : classes.map(cls => (
            <div key={cls.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-start gap-3 p-4 border-b border-slate-100">
                <div className={`w-2 h-10 rounded-full ${cls.court.location.name === "CRYSTAL" ? "bg-green-500" : "bg-blue-500"}`}></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{cls.title}</h3>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{DAYS_FULL[cls.dayOfWeek]}s</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {cls.startTime} – {cls.endTime} · {cls.court.location.displayName} Court {cls.court.number} · Max {cls.maxParticipants}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedClass(selectedClass?.id === cls.id ? null : cls); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-green-400 transition-colors"
                >
                  {selectedClass?.id === cls.id ? "Hide" : "View Sessions"}
                </button>
              </div>

              {selectedClass?.id === cls.id && (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Registrations</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cls.sessions.length === 0 ? (
                          <tr><td colSpan={4} className="py-4 text-center text-slate-400">No sessions</td></tr>
                        ) : cls.sessions.map(sess => {
                          const spots = cls.maxParticipants - sess.reservations.length;
                          return (
                            <tr key={sess.id} className="border-b border-slate-50">
                              <td className="py-3 font-medium text-slate-700">
                                {format(new Date(sess.date + "T00:00:00"), "EEE, MMM d")}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-24">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full"
                                      style={{ width: `${(sess.reservations.length / cls.maxParticipants) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-slate-600">{sess.reservations.length}/{cls.maxParticipants}</span>
                                  {sess.reservations.length > 0 && (
                                    <button
                                      onClick={() => setShowSessionModal(true)}
                                      className="text-xs text-green-600 hover:underline"
                                    >
                                      View
                                    </button>
                                  )}
                                </div>
                                {/* Names */}
                                {sess.reservations.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {sess.reservations.map(r => (
                                      <span key={r.id} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                                        {r.nickname || r.firstName}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${sess.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                  {sess.isActive ? "Active" : "Cancelled"}
                                </span>
                              </td>
                              <td className="py-3">
                                <button
                                  onClick={() => toggleSession(cls.id, sess.date, !sess.isActive)}
                                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                    sess.isActive
                                      ? "border-red-200 text-red-600 hover:bg-red-50"
                                      : "border-green-200 text-green-600 hover:bg-green-50"
                                  }`}
                                >
                                  {sess.isActive ? "Cancel" : "Restore"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
