import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, location, details, contact, anonymous } = body;

    if (!details) {
      return NextResponse.json({ error: "Details are required" }, { status: 400 });
    }

    // Store the tip (in production: database + notify law enforcement)
    const tip = {
      id: `tip_${Date.now().toString(36)}`,
      name: name || null,
      location: location || null,
      details,
      contact: anonymous ? null : contact,
      anonymous: !!anonymous,
      submittedAt: new Date().toISOString(),
    };

    // Log tip (in production: encrypt + store in secure DB)
    console.log("[TribeFIND] Tip received:", tip.id, anonymous ? "(anonymous)" : contact);

    // Email notification to admin
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "TribeFIND <j@engindearing.soy>",
          to: ["j@engindearing.soy"],
          subject: `TribeFIND Tip: ${tip.id}`,
          html: `<p><strong>New tip submitted</strong></p>
            <p>Name: ${name || "Not provided"}</p>
            <p>Location: ${location || "Not provided"}</p>
            <p>Details: ${details}</p>
            <p>Contact: ${anonymous ? "Anonymous" : contact || "None"}</p>
            <p>Time: ${tip.submittedAt}</p>`,
        });
      } catch {}
    }

    return NextResponse.json({ success: true, tipId: tip.id });
  } catch (err) {
    return NextResponse.json({ error: "Failed to submit tip" }, { status: 500 });
  }
}
