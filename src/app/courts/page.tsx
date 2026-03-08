"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, startOfDay } from "date-fns";

const TIME_SLOTS = [
  "06:00","07:00","08:00","09:00","10:00","11:00",
  "12:00","13:00","14:00","15:00","16:00","17:00",
  "18:00","19:00","20:00","21:00",
];

type Court = { id: string; number: number; name: string; locationId: string };
type Location = { id: string; name: string; displayName: string; courts: Court[] };
type Reservation = { courtId: string; startTime: string; endTime: string };

type BookingForm = {
  firstName: string; lastName: string; nickname: string; lineUserId: string;
  startTime: string; endTime: string; courtId: string;
};

export default function CourtsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [locations, setLocations] = useState<Location[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("location") || "ALL");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    firstName: "", lastName: "", nickname: "", lineUserId: "",
    startTime: "09:00", endTime: "10:00", courtId: "",
  });
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/courts").then(r => r.json()).then(setLocations);
  }, []);

  const fetchAvailability = useCallback(() => {
    fetch(`/api/courts/availability?date=${selectedDate}`)
      .then(r => r.json()).then(setReservations);
  }, [selectedDate]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  // Pre-fill user info
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

  const isCourtBooked = (courtId: string, startTime: string) => {
    return reservations.some(r =>
      r.courtId === courtId &&
      r.startTime <= startTime && r.endTime > startTime
    );
  };

  const getCourtStatus = (courtId: string) => {
    const bookedSlots = reservations.filter(r => r.courtId === courtId);
    if (bookedSlots.length === 0) return "available";
    return "partial";
  };

  const openBooking = (court: Court) => {
    if (!session) { router.push("/auth/login"); return; }
    setBookingForm(f => ({ ...f, courtId: court.id }));
    setShowBookingModal(true);
    setBookingError("");
    setBookingSuccess(false);
  };

  const submitBooking = async () => {
    if (!bookingForm.firstName || !bookingForm.lastName) {
      setBookingError("First and last name are required");
      return;
    }
    if (bookingForm.startTime >= bookingForm.endTime) {
      setBookingError("End time must be after start time");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    const res = await fetch("/api/reservations/court", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bookingForm, date: selectedDate }),
    });
    const data = await res.json();
    setBookingLoading(false);
    if (!res.ok) {
      setBookingError(data.error || "Booking failed");
    } else {
      setBookingSuccess(true);
      fetchAvailability();
      setTimeout(() => { setShowBookingModal(false); setBookingSuccess(false); }, 2000);
    }
  };

  const filteredLocations = selectedLocation === "ALL"
    ? locations
    : locations.filter(l => l.name === selectedLocation);

  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d") };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Court Reservations</h1>
        <p className="text-slate-500 text-sm mt-1">Select a date and time to see court availability</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {dateOptions.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="ALL">All Locations</option>
            {locations.map(l => (
              <option key={l.name} value={l.name}>{l.displayName}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-500"></span> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-300"></span> Booked
          </span>
        </div>
      </div>

      {/* Court Grid by Location */}
      {filteredLocations.map(location => (
        <div key={location.id} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${location.name === "CRYSTAL" ? "bg-green-500" : "bg-blue-500"}`}></div>
            <h2 className="text-lg font-bold text-slate-800">{location.displayName}</h2>
            <span className="text-sm text-slate-500">{location.courts.length} courts</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {location.courts.map(court => {
              const status = getCourtStatus(court.id);
              const bookedSlots = reservations.filter(r => r.courtId === court.id);
              const isFullyBooked = bookedSlots.length >= 8;

              return (
                <button
                  key={court.id}
                  onClick={() => !isFullyBooked && openBooking(court)}
                  disabled={isFullyBooked}
                  className={`relative bg-white rounded-xl border-2 p-4 text-left transition-all ${
                    isFullyBooked
                      ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                      : "border-green-200 hover:border-green-400 hover:shadow-md cursor-pointer"
                  }`}
                >
                  {/* Court visual */}
                  <div className={`w-full h-24 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden ${
                    isFullyBooked ? "bg-slate-200" : "bg-green-100"
                  }`}>
                    {/* Tennis court lines */}
                    <div className={`absolute inset-2 border-2 rounded ${isFullyBooked ? "border-slate-300" : "border-green-400"}`}>
                      <div className={`absolute top-1/2 left-0 right-0 border-t ${isFullyBooked ? "border-slate-300" : "border-green-400"}`}></div>
                      <div className={`absolute top-0 bottom-0 left-1/2 border-l ${isFullyBooked ? "border-slate-300" : "border-green-400"}`}></div>
                    </div>
                    <span className={`text-xs font-bold z-10 ${isFullyBooked ? "text-slate-400" : "text-green-700"}`}>
                      {isFullyBooked ? "FULL" : "OPEN"}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 text-sm">{court.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {bookedSlots.length > 0 ? `${bookedSlots.length} booking(s) today` : "No bookings today"}
                  </p>

                  {/* Slot indicators */}
                  <div className="flex gap-0.5 mt-2 flex-wrap">
                    {TIME_SLOTS.slice(0, 10).map(slot => (
                      <div
                        key={slot}
                        className={`w-2 h-2 rounded-sm ${isCourtBooked(court.id, slot) ? "bg-slate-300" : "bg-green-400"}`}
                        title={slot}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Book Court</h2>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-semibold text-slate-800">Booking Confirmed!</p>
                <p className="text-slate-500 text-sm mt-1">Your court has been reserved.</p>
              </div>
            ) : (
              <>
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
                    {bookingError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-sm">
                    <span className="font-medium text-slate-700">Date:</span>{" "}
                    <span className="text-slate-600">{format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Start Time *</label>
                      <select
                        value={bookingForm.startTime}
                        onChange={e => setBookingForm(f => ({ ...f, startTime: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">End Time *</label>
                      <select
                        value={bookingForm.endTime}
                        onChange={e => setBookingForm(f => ({ ...f, endTime: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                        <input
                          type="text" required
                          value={bookingForm.firstName}
                          onChange={e => setBookingForm(f => ({ ...f, firstName: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
                        <input
                          type="text" required
                          value={bookingForm.lastName}
                          onChange={e => setBookingForm(f => ({ ...f, lastName: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nickname</label>
                        <input
                          type="text"
                          value={bookingForm.nickname}
                          onChange={e => setBookingForm(f => ({ ...f, nickname: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Line User ID</label>
                        <input
                          type="text"
                          value={bookingForm.lineUserId}
                          onChange={e => setBookingForm(f => ({ ...f, lineUserId: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={submitBooking}
                    disabled={bookingLoading}
                    className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {bookingLoading ? "Booking..." : "Confirm Reservation"}
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
