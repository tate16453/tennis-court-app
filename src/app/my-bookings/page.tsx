"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

export default function MyBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courtBookings, setCourtBookings] = useState<any[]>([]);
  const [classBookings, setClassBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"courts" | "classes">("courts");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/reservations/court").then(r => r.json()),
      fetch("/api/reservations/class").then(r => r.json()),
    ]).then(([courts, classes]) => {
      setCourtBookings(courts);
      setClassBookings(classes);
      setLoading(false);
    });
  }, [session]);

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Bookings</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        {(["courts", "classes"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto text-center ${
              activeTab === tab ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-green-400"
            }`}
          >
            {tab === "courts" ? `Court Bookings (${courtBookings.length})` : `Class Registrations (${classBookings.length})`}
          </button>
        ))}
      </div>

      {activeTab === "courts" && (
        <div className="space-y-3">
          {courtBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">
              No court bookings yet.
            </div>
          ) : courtBookings.map((b: any) => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">🎾</div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{b.court.location.displayName} — {b.court.name}</p>
                <p className="text-sm text-slate-500">
                  {format(parseISO(b.date), "EEE, MMM d yyyy")} · {b.startTime} – {b.endTime}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                b.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "classes" && (
        <div className="space-y-3">
          {classBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">
              No class registrations yet.
            </div>
          ) : classBookings.map((b: any) => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">🏫</div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{b.classSession.classSchedule.title}</p>
                <p className="text-sm text-slate-500">
                  {format(parseISO(b.classSession.date), "EEE, MMM d yyyy")} ·{" "}
                  {b.classSession.classSchedule.startTime} – {b.classSession.classSchedule.endTime} ·{" "}
                  {b.classSession.classSchedule.court.location.displayName} Court {b.classSession.classSchedule.court.number}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                b.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
