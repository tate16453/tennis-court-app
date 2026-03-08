"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Session = {
  id: string; date: string; isActive: boolean;
  reservations: { id: string }[];
};
type ClassSchedule = {
  id: string; title: string; dayOfWeek: number; startTime: string; endTime: string;
  maxParticipants: number; isActive: boolean;
  coach: { firstName: string; lastName: string; nickname?: string };
  court: { id: string; number: number; name: string; location: { name: string; displayName: string } };
  sessions: Session[];
};

type BookingForm = {
  firstName: string; lastName: string; nickname: string; lineUserId: string;
  classSessionId: string; classTitle: string; sessionDate: string;
};

export default function ClassesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDay, setFilterDay] = useState<number | "ALL">("ALL");
  const [filterLocation, setFilterLocation] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    firstName: "", lastName: "", nickname: "", lineUserId: "",
    classSessionId: "", classTitle: "", sessionDate: "",
  });
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchClasses = () => {
    fetch("/api/classes").then(r => r.json()).then(data => {
      setClasses(data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchClasses(); }, []);

  useEffect(() => {
    if (session?.user) {
      const u = session.user as any;
      setBookingForm(f => ({
        ...f,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        nickname: u.nickname || "",
        lineUserId: u.lineUserId || "",
      }));
    }
  }, [session]);

  const openBooking = (cls: ClassSchedule, sess: Session) => {
    if (!session) { router.push("/auth/login"); return; }
    setBookingForm(f => ({
      ...f,
      classSessionId: sess.id,
      classTitle: cls.title,
      sessionDate: sess.date,
    }));
    setShowModal(true);
    setBookingError("");
    setBookingSuccess(false);
  };

  const submitBooking = async () => {
    if (!bookingForm.firstName || !bookingForm.lastName) {
      setBookingError("First and last name are required");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    const res = await fetch("/api/reservations/class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingForm),
    });
    const data = await res.json();
    setBookingLoading(false);
    if (!res.ok) {
      setBookingError(data.error || "Registration failed");
    } else {
      setBookingSuccess(true);
      fetchClasses();
      setTimeout(() => { setShowModal(false); setBookingSuccess(false); }, 2000);
    }
  };

  const filtered = classes.filter(cls => {
    const dayMatch = filterDay === "ALL" || cls.dayOfWeek === filterDay;
    const locMatch = filterLocation === "ALL" || cls.court.location.name === filterLocation;
    return dayMatch && locMatch;
  });

  const locations = [...new Set(classes.map(c => c.court.location.name))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tennis Classes</h1>
        <p className="text-slate-500 text-sm mt-1">Browse available classes and register for a session</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Day</label>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterDay("ALL")}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${filterDay === "ALL" ? "bg-green-600 text-white border-green-600" : "border-slate-200 text-slate-600 hover:border-green-400"}`}
            >
              All
            </button>
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => setFilterDay(i)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${filterDay === i ? "bg-green-600 text-white border-green-600" : "border-slate-200 text-slate-600 hover:border-green-400"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto">
          <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
          <select
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="ALL">All Locations</option>
            {locations.map(l => (
              <option key={l} value={l}>{l === "CRYSTAL" ? "Crystal" : "Crystal G"}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading classes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No classes found for the selected filters.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cls => (
            <ClassCard key={cls.id} cls={cls} onBook={openBooking} />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Register for Class</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-semibold text-slate-800">Registration Confirmed!</p>
                <p className="text-slate-500 text-sm mt-1">You&apos;re registered for {bookingForm.classTitle}</p>
              </div>
            ) : (
              <>
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
                    {bookingError}
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
                  <p className="font-medium text-slate-700">{bookingForm.classTitle}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {bookingForm.sessionDate && format(parseISO(bookingForm.sessionDate), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                      <input type="text" required value={bookingForm.firstName}
                        onChange={e => setBookingForm(f => ({ ...f, firstName: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
                      <input type="text" required value={bookingForm.lastName}
                        onChange={e => setBookingForm(f => ({ ...f, lastName: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nickname</label>
                      <input type="text" value={bookingForm.nickname}
                        onChange={e => setBookingForm(f => ({ ...f, nickname: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Line User ID</label>
                      <input type="text" value={bookingForm.lineUserId}
                        onChange={e => setBookingForm(f => ({ ...f, lineUserId: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={submitBooking}
                    disabled={bookingLoading}
                    className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors mt-2"
                  >
                    {bookingLoading ? "Registering..." : "Confirm Registration"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClassCard({ cls, onBook }: { cls: ClassSchedule; onBook: (cls: ClassSchedule, sess: Session) => void }) {
  const isGreen = cls.court.location.name === "CRYSTAL";
  const accent = isGreen ? "bg-green-600" : "bg-blue-600";
  const accentLight = isGreen ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700";

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={`${accent} text-white p-4`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium opacity-80">{DAYS_FULL[cls.dayOfWeek]}s</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{cls.court.location.displayName}</span>
        </div>
        <h3 className="font-bold text-base">{cls.title}</h3>
        <p className="text-sm opacity-80 mt-0.5">{cls.startTime} – {cls.endTime}</p>
      </div>

      {/* Court Visual */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
            C{cls.court.number}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">Court {cls.court.number}</p>
            <p className="text-xs text-slate-400">{cls.court.location.displayName}</p>
          </div>
          <div className={`ml-auto text-xs px-2 py-0.5 rounded-full ${accentLight}`}>
            Max {cls.maxParticipants}
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Coach: {cls.coach.nickname || `${cls.coach.firstName} ${cls.coach.lastName}`}
        </p>
      </div>

      {/* Sessions */}
      <div className="px-4 pb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Upcoming Sessions</p>
        <div className="space-y-2">
          {cls.sessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No upcoming sessions</p>
          ) : (
            cls.sessions.slice(0, 3).map(sess => {
              const spots = cls.maxParticipants - sess.reservations.length;
              const full = spots <= 0;
              return (
                <div key={sess.id} className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      {format(parseISO(sess.date), "EEE, MMM d")}
                    </p>
                    <p className={`text-xs mt-0.5 ${full ? "text-red-500" : "text-green-600"}`}>
                      {full ? "Full" : `${spots} spot${spots !== 1 ? "s" : ""} left`}
                    </p>
                  </div>
                  <button
                    onClick={() => !full && sess.isActive && onBook(cls, sess)}
                    disabled={full || !sess.isActive}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      full || !sess.isActive
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {full ? "Full" : !sess.isActive ? "Unavailable" : "Register"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
