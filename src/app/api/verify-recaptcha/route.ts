import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Server-side reCAPTCHA v3 verification for affiliate app
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    const secretKey = process.env.GRECAPTCHA_SECRETKEY_PULSEISP;
    if (!secretKey) {
      console.warn("[RECAPTCHA] Missing GRECAPTCHA_SECRETKEY_PULSEISP env var — allowing request");
      return NextResponse.json({ success: true, score: 1.0 });
    }

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await verifyRes.json();

    if (!data.success) {
      console.warn("[RECAPTCHA] Verification failed:", data["error-codes"]);
      return NextResponse.json({ success: false, score: 0 }, { status: 403 });
    }

    const score = data.score || 0;
    const passed = score >= 0.5;

    console.log(`[RECAPTCHA] Score: ${score} — ${passed ? "PASSED" : "FAILED"}`);

    return NextResponse.json({
      success: passed,
      score,
      action: data.action,
    });
  } catch (err: any) {
    console.error("[RECAPTCHA] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
