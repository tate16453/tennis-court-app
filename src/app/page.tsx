import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-green-300 rounded-full"></span>
            Online Reservations Now Available
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Crystal Tennis Courts</h1>
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
            Book courts and classes at Crystal & Crystal G. No more group chat reservations — instant confirmation, real-time availability.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/courts" className="bg-white text-green-800 font-semibold px-8 py-3 rounded-lg hover:bg-green-50 transition-colors">
              Book a Court
            </Link>
            <Link href="/classes" className="bg-green-600 text-white font-semibold px-8 py-3 rounded-lg border border-green-400 hover:bg-green-500 transition-colors">
              View Classes
            </Link>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">Our Locations</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-2xl">🎾</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Crystal</h3>
            <p className="text-slate-500 mb-4">Location A · 8 tennis courts</p>
            <Link href="/courts?location=CRYSTAL" className="text-green-600 font-medium hover:text-green-700 text-sm">View courts →</Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-2xl">🎾</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Crystal G</h3>
            <p className="text-slate-500 mb-4">Location B · 9 tennis courts</p>
            <Link href="/courts?location=CRYSTAL_G" className="text-blue-600 font-medium hover:text-blue-700 text-sm">View courts →</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-t border-slate-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">Why Book Online?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Instant Confirmation", desc: "No waiting for staff to announce availability in group chats." },
              { icon: "📅", title: "Real-time Availability", desc: "See exactly which courts are free for your chosen date and time." },
              { icon: "🏫", title: "Class Registration", desc: "Browse coach schedules, see spots left, and register with one click." },
            ].map((f) => (
              <div key={f.title} className="text-center p-4">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
