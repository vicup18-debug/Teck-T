import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // 1. Get the reference ID from the URL that Paystack sends back
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
        return NextResponse.redirect(new URL("/?error=no_reference", request.url));
    }

    try {
        // 2. Securely ask Paystack if this transaction was successful
        const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const paystackData = await paystackRes.json();

        // 3. If Paystack confirms they paid the ₦7,500
        if (paystackData.data?.status === "success") {

            // Update the student's record in your database
            await supabaseAdmin
                .from("registrations")
                .update({ payment_status: "success" })
                .eq("id", reference); // We used the Supabase ID as the reference earlier!

            // Redirect them to the homepage with a success message in the URL
            return NextResponse.redirect(new URL("/?status=paid", request.url));
        }

        // If payment failed or was abandoned
        return NextResponse.redirect(new URL("/?status=failed", request.url));

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.redirect(new URL("/?error=server_error", request.url));
    }
}