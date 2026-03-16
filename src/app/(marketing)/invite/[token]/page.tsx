"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Calendar, DollarSign, Loader2, ExternalLink } from "lucide-react";

function MeetingScheduler({
  token,
  existingLink,
  onBooked,
}: {
  token: string;
  existingLink?: string;
  onBooked: (link: string) => void;
}) {
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    fetch(`/api/calendar/availability?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((d) => {
        setSlots(d.slots || []);
        setConfigured(d.configured ?? false);
      })
      .finally(() => setLoadingSlots(false));
  }, [token]);

  async function handleBookSlot(slot: { start: string; end: string }) {
    setBooking(true);
    setBookError("");
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, slotStart: slot.start, slotEnd: slot.end }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book");
      if (data.meetLink) onBooked(data.meetLink);
    } catch (err) {
      setBookError(err instanceof Error ? err.message : "Failed to book");
    } finally {
      setBooking(false);
    }
  }

  const displayLink = existingLink;

  if (displayLink) {
    return (
      <div>
        <div className="flex items-center gap-2 text-primary-light font-medium mb-2">
          <Calendar size={18} />
          Free consultation
        </div>
        <a
          href={displayLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary-light hover:text-white transition-colors"
        >
          Join your Google Meet
          <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  if (!configured || slots.length === 0) {
    if (!configured) return null;
    if (loadingSlots) {
      return (
        <div className="flex items-center gap-2 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading available times...
        </div>
      );
    }
    return (
      <div className="text-muted text-sm">
        No available times in the next 2 weeks. Please contact us to schedule.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-primary-light font-medium mb-2">
        <Calendar size={18} />
        Pick a time for your free consultation
      </div>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <button
            key={slot.start}
            onClick={() => handleBookSlot(slot)}
            disabled={booking}
            className="px-4 py-2 rounded-lg bg-surface hover:bg-primary/20 border border-border text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {new Date(slot.start).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </button>
        ))}
      </div>
      {bookError && <p className="text-red-400 text-sm mt-2">{bookError}</p>}
    </div>
  );
}

type InviteData = {
  full_name: string;
  email: string;
  organization: string | null;
  custom_message: string;
  estimate: string;
  meeting_link: string;
};

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Invalid invite link");
      return;
    }
    fetch(`/api/invite/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invite not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Invite not found or expired"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleApprove() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");
      setAccepted(true);
      setTimeout(() => router.push("/login?redirect=/portal"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-light" size={32} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid or expired invite</h1>
          <p className="text-muted mb-6">{error}</p>
          <Link
            href="/contact"
            className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium"
          >
            Get in touch
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-400" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h1>
          <p className="text-muted mb-6">
            Your client portal account has been created. Redirecting you to log in...
          </p>
          <p className="text-sm text-muted">
            Log in with <strong className="text-white">{data?.email}</strong> and password <strong className="text-white">Welcome123!</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Mike Tintner Productions"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-2xl font-bold text-white">Your project estimate</h1>
          <p className="text-muted mt-1">Hi {data?.full_name}, here&apos;s what we discussed.</p>
        </div>

        <div className="bg-surface-light border border-border rounded-xl p-6 space-y-6">
          {data?.custom_message && (
            <div>
              <p className="text-white whitespace-pre-wrap">{data.custom_message}</p>
            </div>
          )}
          {data?.estimate && (
            <div>
              <div className="flex items-center gap-2 text-primary-light font-medium mb-2">
                <DollarSign size={18} />
                Rough estimate
              </div>
              <p className="text-white whitespace-pre-wrap">{data.estimate}</p>
            </div>
          )}

          <MeetingScheduler
            token={token}
            existingLink={meetingLink || data?.meeting_link}
            onBooked={(link) => setMeetingLink(link)}
          />

          <div className="pt-4 border-t border-border">
            <p className="text-muted text-sm mb-4">
              Ready to move forward? Click below to create your client portal account. You&apos;ll get access to view projects, quotes, and communicate with us.
            </p>
            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}
            <button
              onClick={handleApprove}
              disabled={accepting}
              className="w-full py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Approve & get portal access
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-muted text-sm mt-6">
          Questions? <Link href="/contact" className="text-primary-light hover:text-white">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
