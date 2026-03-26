import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default function RegistrationPage({
  searchParams,
}: {
  searchParams: { status?: string; error?: string };
}) {

  // 1. Check the URL for the success status
  const status = searchParams?.status;
  const isPaidSuccess = status === "paid";
  const isFreeSuccess = status === "free_success";
  const isSuccess = isPaidSuccess || isFreeSuccess;

  // Your backend logic remains exactly the same
  async function handleRegistration(formData: FormData) {
    "use server";
    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";

    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const track = formData.get("track") as string;
    const tier = formData.get("tier") as string;

    const initialStatus = tier === "free" ? "free" : "pending";

    const { data: student, error } = await supabaseAdmin
      .from("registrations")
      .insert([{ full_name: fullName, email, track, payment_status: initialStatus }])
      .select()
      .single();

    if (error) {
      throw new Error("Failed to register. You might already be registered.");
    }

    if (tier === "free") {
      redirect(`${origin}/?status=free_success`);
    }

    // Initializing Paystack for ₦7,500 Premium Tier
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        amount: 7500 * 100,
        reference: student.id,
        callback_url: '${origin}/api/verify',
        metadata: { track, full_name: fullName, tier: "premium" },
      }),
    });

    const paystackData = await paystackRes.json();

    if (paystackData.status) {
      redirect(paystackData.data.authorization_url);
    } else {
      throw new Error("Payment initialization failed");
    }
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white font-sans">

      {/* LEFT SIDE - The Value Proposition */}
      <div className="lg:w-1/2 bg-slate-950 p-8 lg:p-20 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
          <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 tracking-wide uppercase mb-8">
            <span className="flex w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
            Registration Open for Cohort 2.0
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Stop watching tutorials. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Start building systems.
            </span>
          </h1>

          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Tech Talk Academy is a focused, 90-day sprint. Start with our Free Audit tier to taste the value, or jump into Premium for full mentorship and portfolio engineering.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Dynamic UI (Form OR Success Screen) */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-20 bg-slate-50 relative">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-slate-100 p-8 lg:p-10 transition-all duration-500">

          {/* SUCCESS SCREEN */}
          {isSuccess ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                {isPaidSuccess ? "Payment Successful!" : "Welcome Aboard!"}
              </h2>
              <p className="text-slate-500 mb-8">
                {isPaidSuccess
                  ? "Your Premium Access is confirmed. We've sent a receipt and onboarding instructions to your email."
                  : "Your Free Audit registration is complete. Keep an eye on your inbox for your access links."}
              </p>
              <a
                href="/"
                className="inline-flex items-center justify-center w-full rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors"
              >
                Return Home
              </a>
            </div>
          ) : (

            /* REGISTRATION FORM */
            <>
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Secure Your Spot</h2>
              </div>

              <form action={handleRegistration} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" name="fullName" required className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" placeholder="John Doe" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" name="email" required className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Your Path</label>
                  <select name="track" required defaultValue="" className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600">
                    <option value="" disabled className="text-slate-400">Choose a specialization...</option>
                    <option value="cloud">☁️ Cloud Computing</option>
                    <option value="web">🌐 Web Development</option>
                    <option value="blockchain">⛓️ Blockchain & Web3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Your Tier</label>
                  <select name="tier" required defaultValue="" className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600">
                    <option value="" disabled className="text-slate-400">Choose your commitment...</option>
                    <option value="free">Free Audit (View Only)</option>
                    <option value="premium">Premium Access (₦7,500/month)</option>
                  </select>
                </div>

                <button type="submit" className="w-full mt-4 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-indigo-600 px-4 py-4 text-sm font-bold text-white shadow-lg transition-all duration-300">
                  Complete Registration
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}