#!/usr/bin/env python3
"""Compact Letter PDF of the redesigned operating plan (stdlib only)."""

from __future__ import annotations

import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "CenterLinked-Business-Plan-2026-09-14.pdf"

W, H = 612, 792
ML, MR, MT, MB = 50, 46, 48, 42
TEAL = (0.125, 0.533, 0.722)
TEAL_D = (0.090, 0.416, 0.565)
NAVY = (0.000, 0.188, 0.282)
INK = (0.102, 0.165, 0.200)
MUTED = (0.357, 0.420, 0.459)
LINE = (0.886, 0.933, 0.953)
PAPER = (0.965, 0.980, 0.988)
SOFT = (0.933, 0.965, 0.976)
WHITE = (1, 1, 1)


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def rgb(op: str, c) -> str:
    return f"{c[0]:.3f} {c[1]:.3f} {c[2]:.3f} {op}"


class Pdf:
    def __init__(self) -> None:
        self.pages: list[str] = []
        self.buf: list[str] = []
        self.n = 0

    def flush(self) -> None:
        if self.buf:
            self.pages.append("\n".join(self.buf))
            self.buf = []

    def page(self, footer: str) -> None:
        self.flush()
        self.n += 1
        self.rect(0, 0, W, H, WHITE)
        self.rect(0, 0, 8, H, TEAL)
        self.buf.append(rgb("RG", LINE) + "\n0.6 w")
        self.buf.append(f"{ML:.1f} {H - 32:.1f} m {W - MR:.1f} {H - 32:.1f} l S")
        self.text(ML, H - 26, "CENTERLINKED INC.", 7.5, TEAL, True)
        self.text(W - MR - 150, H - 26, footer.upper() if False else footer, 8, MUTED, False)
        self.buf.append(rgb("RG", LINE) + "\n0.5 w")
        self.buf.append(f"{ML:.1f} 32 m {W - MR:.1f} 32 l S")
        self.text(ML, 22, "Confidential", 8, MUTED, False)
        self.text(W - MR - 12, 22, str(self.n), 8, MUTED, False)

    def text(self, x, y, s, size, color, bold=False) -> None:
        font = "Helvetica-Bold" if bold else "Helvetica"
        self.buf += [
            "BT",
            f"/{font} {size:.1f} Tf",
            rgb("rg", color),
            f"1 0 0 1 {x:.2f} {y:.2f} Tm",
            f"({esc(s)}) Tj",
            "ET",
        ]

    def rect(self, x, y, w, h, fill, stroke=None) -> None:
        self.buf.append(rgb("rg", fill))
        if stroke:
            self.buf.append(rgb("RG", stroke) + "\n0.8 w")
            self.buf.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re B")
        else:
            self.buf.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re f")

    def h2(self, y, title: str) -> float:
        self.text(ML, y, title, 13, NAVY, True)
        y -= 8
        self.buf.append(rgb("RG", LINE) + "\n0.8 w")
        self.buf.append(f"{ML:.1f} {y:.1f} m {W - MR:.1f} {y:.1f} l S")
        return y - 16

    def para(self, x, y, text, width, size=9.5, leading=12.5, color=INK, bold=False) -> float:
        avg = size * (0.50 if bold else 0.47)
        words = text.split()
        line, lines = "", []
        for w in words:
            trial = w if not line else f"{line} {w}"
            if len(trial) * avg > width and line:
                lines.append(line)
                line = w
            else:
                line = trial
        if line:
            lines.append(line)
        for ln in lines:
            self.text(x, y, ln, size, color, bold)
            y -= leading
        return y

    def finish(self) -> bytes:
        self.flush()
        objs: list[bytes] = []
        objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
        kids = " ".join(f"{3 + i} 0 R" for i in range(len(self.pages)))
        fh, fb = 3 + 2 * len(self.pages), 3 + 2 * len(self.pages) + 1
        objs.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(self.pages)} >>".encode())
        for i in range(len(self.pages)):
            cid = 3 + len(self.pages) + i
            objs.append(
                (
                    f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] /Contents {cid} 0 R "
                    f"/Resources << /Font << /Helvetica {fh} 0 R /Helvetica-Bold {fb} 0 R >> >> >>"
                ).encode()
            )
        for stream in self.pages:
            raw = zlib.compress(stream.encode("latin-1", "replace"), 9)
            objs.append(b"<< /Length %d /Filter /FlateDecode >>\nstream\n" % len(raw) + raw + b"\nendstream")
        objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
        objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
        out = bytearray(b"%PDF-1.4\n")
        offs = [0]
        for i, obj in enumerate(objs, 1):
            offs.append(len(out))
            out += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
        xref = len(out)
        out += f"xref\n0 {len(objs) + 1}\n".encode()
        out += b"0000000000 65535 f \n"
        for o in offs[1:]:
            out += f"{o:010d} 00000 n \n".encode()
        out += f"trailer << /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
        return bytes(out)


def cover(p: Pdf) -> None:
    p.flush()
    p.n += 1
    p.rect(0, 0, W, H, WHITE)
    p.rect(0, 0, 10, H, TEAL)
    p.text(50, 730, "CONFIDENTIAL OPERATING PLAN", 8, TEAL, True)
    p.rect(50, 678, 36, 36, TEAL)
    p.text(96, 688, "CenterLinked", 18, TEAL, True)
    p.text(50, 600, "Business Plan", 32, NAVY, True)
    y = p.para(50, 560, "A live referral profile for behavioral-health BD teams. Listing is free. Membership is optional. Search is the habit.", 420, 12, 16, MUTED)
    y -= 18
    p.buf.append(rgb("RG", LINE) + "\n0.8 w")
    p.buf.append(f"50 {y:.1f} m 520 {y:.1f} l S")
    y -= 28
    meta = [
        ("ENTITY", "CenterLinked Inc."),
        ("DATE", "September 14, 2026"),
        ("PRODUCT", "centerlinked.com"),
        ("LOCATION", "Florida"),
        ("GOVERNING LAW", "Florida"),
        ("STATUS", "Production  |  listed free"),
    ]
    for i, (k, v) in enumerate(meta):
        x = 50 + (i % 3) * 170
        yy = y - (i // 3) * 40
        p.text(x, yy + 12, k, 7, MUTED, True)
        p.text(x, yy - 4, v, 10, NAVY, True)
    p.buf.append(rgb("RG", TEAL) + "\n0.9 w")
    p.buf.append("50 70 m 130 70 l S")
    p.text(50, 52, "CONFIDENTIAL", 8, TEAL_D, True)
    p.text(300, 52, "Supersedes August 22, 2026  |  Not a fundraising deck", 8, MUTED, False)


def metric(p, x, y, w, h, n, label) -> None:
    p.rect(x, y, w, h, PAPER, LINE)
    p.text(x + 10, y + h - 22, n, 14, TEAL_D, True)
    p.para(x + 10, y + h - 38, label, w - 18, 7.5, 10, MUTED)


def card(p, x, y, w, h, title, body, featured=False) -> None:
    p.rect(x, y, w, h, SOFT if featured else WHITE, LINE)
    p.text(x + 10, y + h - 16, title.upper(), 7.5, TEAL_D, True)
    p.para(x + 10, y + h - 32, body, w - 20, 8.5, 11, INK)


def plan_card(p, x, y, w, h, tag, price, unit, who, free=False, mid=False) -> None:
    fill = NAVY if free else (SOFT if mid else WHITE)
    p.rect(x, y, w, h, fill, None if free else LINE)
    tc = (0.624, 0.831, 0.918) if free else TEAL
    pc = WHITE if free else NAVY
    uc = (0.773, 0.867, 0.910) if free else MUTED
    wc = (0.906, 0.953, 0.973) if free else INK
    p.text(x + 10, y + h - 18, tag.upper(), 7, tc, True)
    p.text(x + 10, y + h - 42, price, 20, pc, True)
    p.text(x + 10, y + h - 56, unit, 7.5, uc, False)
    p.para(x + 10, y + 28, who, w - 20, 8, 10.5, wc)


def build() -> None:
    p = Pdf()
    cover(p)

    p.page("Operating snapshot")
    y = p.h2(H - 56, "How to read this plan")
    y = p.para(ML, y, "This is the current operating document for CenterLinked Inc. Facts come from the live product, Terms 8, and the published catalog in the app. Customer counts, ARR, conversion, burn, and headcount are not invented here.", 516)
    y -= 6
    mw = 122
    metric(p, ML, y - 70, mw, 68, "$0", "Listed. No card. Search the same day.")
    metric(p, ML + 128, y - 70, mw, 68, "$99-$499", "Membership by live facility count, 1 to 15.")
    metric(p, ML + 256, y - 70, mw, 68, "Unlimited", "Team seats on paid plans. Partners never pay.")
    metric(p, ML + 384, y - 70, mw, 68, "Off", "Community Feed and Messenger stay gated.")
    y -= 88
    card(p, ML, y - 132, 250, 132, "What changed in September", "Claiming and listing is free. Price follows live facility count. App home is Search. ZIP, specialty, accreditation, and plan-type filters shipped. PDF import, launch-import, and a data-quality ops desk shipped.", False)
    card(p, ML + 266, y - 132, 250, 132, "What did not change", "Not a consumer directory, patient portal, or PHI store. Search placement is not for sale. Billing does not hard-lock Search or Facilities. Work-email gate. Florida entity. Live at centerlinked.com.", False)
    y -= 150
    p.rect(ML, y - 52, 516, 52, PAPER)
    p.rect(ML, y - 52, 3, 52, TEAL)
    p.para(ML + 12, y - 14, "Honest status. Product-complete, commercially early. Listing and Search do not require a paid plan. Membership and Done For You are live in Stripe. The app does not yet block adding facilities above a subscribed count.", 492, 8.5, 11, INK)

    p.page("Problem and product")
    y = p.h2(H - 56, "Who this is for")
    card(p, ML, y - 88, 166, 88, "Pays", "The treatment organization, when it chooses membership or Done For You. Checkout is org admin only.")
    card(p, ML + 176, y - 88, 166, 88, "Operates", "BD, admissions, marketing. Work email. Free accounts can search without claiming an org.")
    card(p, ML + 352, y - 88, 164, 88, "Never billed", "Hospitals, case managers, therapists, other BD reps, probation officers.")
    y -= 112
    y = p.h2(y, "The leave-behind")
    card(p, ML, y - 100, 250, 100, "Public URL", "Organization sheet at /o/:slug. Program sheet per location. One-facility orgs skip the overview. Make a Referral calls, texts, or emails the named BD contact.")
    card(p, ML + 266, y - 100, 250, 100, "Trust cadence", "Fresh 30 days. Recent 31-60. Stale 61-90. Frozen drops out of Search. A facility stamp is not payer-contract proof. Weekly reminders already run.")
    y -= 124
    y = p.h2(y, "What ships today")
    for i, item in enumerate([
        "Work-email join at /join; skip-to-Search",
        "Search: insurance, plan type, geo, ZIP, specialty, accreditation",
        "Org results with facility cards",
        "Structured insurance; reusable BD owners",
        "PDF import with review-then-save",
        "Launch-import for assisted setup",
        "Org branding, one-pagers, OG previews",
        "Super-admin data quality queues",
    ]):
        x = ML if i % 2 == 0 else ML + 268
        yy = y - (i // 2) * 16
        p.rect(x, yy - 2, 6, 6, TEAL)
        p.text(x + 12, yy - 2, item, 8.5, INK, False)
    y -= 78
    p.rect(ML, y - 40, 516, 40, PAPER)
    p.rect(ML, y - 40, 3, 40, TEAL)
    p.para(ML + 12, y - 12, "Community Feed and Messenger exist in the codebase. FEATURES.community is false. Do not turn them on until sheets and Search are clearly the habit.", 492, 8.5, 11)

    p.page("Commercial model")
    y = p.h2(H - 56, "Billing, as sold")
    y = p.para(ML, y, "The organization pays. Referral partners never do. Search rank is not for sale. Listing is $0 so the catalog can be dense enough that Search is worth opening. Membership is optional and priced by how many live facilities the org lists - not by seats.", 516)
    y -= 8
    pw, ph = 122, 148
    plan_card(p, ML, y - ph, pw, ph, "Listed", "$0", "No card required", "Claim, stay listed, and search. The on-ramp for catalog density.", free=True)
    plan_card(p, ML + 130, y - ph, pw, ph, "1 facility", "$99", "/month  |  $990 year", "One location. One live link. Done For You $499.")
    plan_card(p, ML + 260, y - ph, pw, ph, "Most orgs  |  5", "$249", "/month  |  $2,490 year", "Published bookend. Regional groups. Done For You $1,200.", mid=True)
    plan_card(p, ML + 390, y - ph, pw, ph, "15 facilities", "$499", "/month  |  $4,990 year", "Multi-site source of truth. Done For You $2,500. 16+ quoted.")
    y -= ph + 16
    y = p.para(ML, y, "Each count from 2-14 has its own published price between those bookends. Annual billing is two months free. Team seats are unlimited on paid plans so the whole BD team shares one link.", 516, 9, 12)
    y -= 8
    card(p, ML, y - 118, 250, 118, "Every paid plan includes", "Organization dashboard and public profile. Unlimited seats and updates. Monthly verification. Insurance, level of care, referral contacts. Authenticated Search.")
    card(p, ML + 266, y - 118, 250, 118, "Done For You", "Labor-scaled setup. $499 is the one-location landing number. A 15-location build is $2,500, not $499. 16+ is quoted. Launch-import lets a helper ingest a PDF without inventing addresses or contacts.", True)
    y -= 136
    p.rect(ML, y - 56, 516, 56, PAPER)
    p.rect(ML, y - 56, 3, 56, TEAL)
    p.para(ML + 12, y - 14, "Current commercial reality. Inactive memberships see a dismissible banner. Search and Facilities stay open. Terms 8: organizations that have not subscribed may continue to use the Service. Per-count Checkout amounts are live; the app does not yet cap facilities at the subscribed count.", 492, 8.5, 11)

    p.page("Published catalog")
    y = p.h2(H - 56, "Membership and Done For You by live facility count")
    y = p.para(ML, y, "Source of truth: the pricing module in the product. Must stay in sync with the landing slider, billing UI, Terms 8, and Stripe Checkout amounts. Partners who only view a public profile are not billed.", 516, 9, 12)
    y -= 6
    rows = [
        ("group", "Free listed", "", "", ""),
        ("Listed  |  no card", "$0", "-", "-"),
        ("group", "Self-serve membership", "", "", ""),
        ("1", "$99", "$990", "$499"),
        ("2", "$149", "$1,490", "$675"),
        ("3", "$189", "$1,890", "$850"),
        ("4", "$219", "$2,190", "$1,025"),
        ("5  |  bookend", "$249", "$2,490", "$1,200"),
        ("6", "$279", "$2,790", "$1,330"),
        ("7", "$309", "$3,090", "$1,460"),
        ("8", "$339", "$3,390", "$1,590"),
        ("9", "$369", "$3,690", "$1,720"),
        ("10", "$399", "$3,990", "$1,850"),
        ("11", "$429", "$4,290", "$1,980"),
        ("12", "$449", "$4,490", "$2,110"),
        ("13", "$469", "$4,690", "$2,240"),
        ("14", "$489", "$4,890", "$2,370"),
        ("15  |  bookend", "$499", "$4,990", "$2,500"),
        ("group", "Enterprise", "", "", ""),
        ("16+", "Quote from ~$799/mo", "Quote", "Quote"),
    ]
    cols = [200, 100, 100, 116]
    headers = ["Live facilities", "Monthly", "Annual", "Done For You"]
    x0 = ML
    p.text(x0, y, headers[0].upper(), 7, MUTED, True)
    p.text(x0 + 210, y, headers[1].upper(), 7, MUTED, True)
    p.text(x0 + 310, y, headers[2].upper(), 7, MUTED, True)
    p.text(x0 + 410, y, headers[3].upper(), 7, MUTED, True)
    y -= 6
    p.buf.append(rgb("RG", NAVY) + "\n1 w")
    p.buf.append(f"{ML:.1f} {y:.1f} m {W - MR:.1f} {y:.1f} l S")
    y -= 14
    for row in rows:
        if row[0] == "group":
            p.rect(ML, y - 4, 516, 14, PAPER)
            p.text(ML + 6, y, row[1].upper(), 7, TEAL_D, True)
            y -= 16
            continue
        p.text(ML + 6, y, row[0], 8.5, INK, False)
        p.text(ML + 210, y, row[1], 8.5, INK, True)
        p.text(ML + 310, y, row[2], 8.5, INK, True)
        p.text(ML + 410, y, row[3], 8.5, INK, True)
        y -= 13
    y -= 8
    p.para(ML, y, "Checkout still groups 1 / 2-5 / 6-15 for Stripe, but the dollar amount is the row above. Software COGS is low relative to paid price. The constraint is ops cost per org. Freeze semantics keep free listed inventory honest.", 516, 8.5, 11)

    p.page("Market and go-to-market")
    y = p.h2(H - 56, "Market we are actually in")
    y = p.para(ML, y, "Industry backdrop, not CenterLinked data: IBISWorld counts on the order of 5,128 residential mental-health / substance-abuse businesses (2026). Licensed SUD facilities have been estimated around 17,000. Those mix facilities with organizations.", 516)
    y = p.para(ML, y, "Software TAM is U.S. behavioral-health orgs that take professional referrals. A defensible org-count is 5,000-15,000. This is a focused vertical. We are not sizing consumer rehab-near-me search.", 516)
    y -= 8
    card(p, ML, y - 92, 250, 92, "If 400 orgs pay", "All 1-facility at $99/mo is about $475k ARR. Mix of 50% at 1 / 35% at 5 / 15% at 10 is about $943k ARR. Scenarios, not forecasts. Listed orgs are not paying orgs.")
    card(p, ML + 266, y - 92, 250, 92, "ICP vs anti-ICP", "ICP: multi-location groups that already print collateral and lose deals to stale insurance lists. Anti-ICP: anyone who wants CenterLinked to get us patients from Google.")
    y -= 116
    y = p.h2(y, "How we go to market")
    for i, item in enumerate([
        "Free Search as the habit. Join at /join, skip org claim, run an insurance + geography query the same day.",
        "Free listing as catalog. Density in 1-2 metros still beats a national slogan.",
        "Founder-led BD. The URL, the one-pager, and Make a Referral are the conference leave-behind.",
        "Done For You / launch-import for busy CEOs, priced so a 10-location build is not $499.",
        "Convert listed to paid when the live link is clearly their professional infrastructure. Do not pretend Search is paid-only while it is free.",
    ]):
        p.text(ML, y, f"{i + 1}.", 9, TEAL_D, True)
        y = p.para(ML + 16, y, item, 500, 9, 12)
        y -= 4
    y -= 4
    p.para(ML, y, "Do not buy rehab-near-me. Do not promise to fill beds.", 516, 9.5, 12, NAVY, True)

    p.page("18 months  |  risk  |  line")
    y = p.h2(H - 56, "Recommended operating plan")
    card(p, ML, y - 120, 166, 120, "Months 0-6", "Density and Search habit. Professionals into Search the same day. Orgs listed via self-serve, PDF, or DFY. Community stays off. Success: a real insurance + geography answer in the first metro.")
    card(p, ML + 176, y - 120, 166, 120, "Months 6-12", "One or two geographies. Hold verify-on-time as listing grows. Sell annual. Land multi-site groups above $99. Success: ZIP/city queries useful; completeness up, not just org count.", True)
    card(p, ML + 352, y - 120, 164, 120, "Months 12-18", "Named date for the free/paid boundary. Enforce facility-count caps if mix shows gaming. Revisit community only after the habit is real.")
    y -= 140
    y = p.h2(y, "Risks we will not hand-wave")
    risks = [
        ("Slow paid adoption", "Free Search + listed catalog; DFY wedge; keep $99 on-ramp"),
        ("Free listed never converts", "Convert on infrastructure, not by fake-gating Search"),
        ("Catalog rot at free scale", "Freeze; completeness desk; do not outrun verification"),
        ("Billing stays undefined", "Named date: keep, grandfather, or hard-gate"),
        ("Confused with consumer directories", "Work-email gate; refuse patient features"),
        ("PHI or invented import data", "No clinical workflows; do not invent addresses or contacts"),
    ]
    p.text(ML, y, "RISK", 7, MUTED, True)
    p.text(ML + 210, y, "MITIGATION", 7, MUTED, True)
    y -= 6
    p.buf.append(rgb("RG", NAVY) + "\n1 w")
    p.buf.append(f"{ML:.1f} {y:.1f} m {W - MR:.1f} {y:.1f} l S")
    y -= 14
    for r, m in risks:
        p.text(ML, y, r, 8, INK, True)
        p.text(ML + 210, y, m, 8, INK, False)
        y -= 14
    y -= 8
    y = p.h2(y, "The line we will not cross")
    y = p.para(ML, y, "Consumer treatment directory. Patient intake, scheduling, medical advice, or clinical decision support. PHI. Open consumer lead-gen. Social network as the Phase-1 core. Paid Search placement. Inventing facility addresses or BD contacts to make an import look complete.", 516)
    y -= 8
    p.rect(ML, y - 48, 516, 48, PAPER)
    p.rect(ML, y - 48, 3, 48, TEAL)
    p.para(ML + 12, y - 12, "Team, financials, funding are not in the product repo. Do not send this plan to a third party with invented headcount, burn, runway, or a raise amount.", 492, 8.5, 11)

    p.page("Shipped  |  open items")
    y = p.h2(H - 56, "Shipped product surface")
    shipped = [
        ("Landing, Privacy, Terms", "Live"),
        ("/join, optional PDF import, /start login", "Live"),
        ("Auth, work-email gate, skip-to-Search", "Live"),
        ("Dashboard, facilities, structured insurance", "Live"),
        ("Search: ZIP, specialty, accreditation, plan type", "Live"),
        ("Public sheets, Make a Referral, one-facility skip, removal", "Live"),
        ("One-pagers, OG previews", "Live"),
        ("Stripe membership, DFY, portal, 16+ inquiry", "Live  |  optional / soft-gated"),
        ("Verification + weekly reminder cron", "Live"),
        ("Admin workspace, data quality, completeness queues", "Live"),
        ("PDF parse + launch-import", "Live"),
        ("Community Feed / Messenger", "Built, gated off"),
    ]
    p.text(ML, y, "SURFACE", 7, MUTED, True)
    p.text(ML + 360, y, "STATUS", 7, MUTED, True)
    y -= 6
    p.buf.append(rgb("RG", NAVY) + "\n1 w")
    p.buf.append(f"{ML:.1f} {y:.1f} m {W - MR:.1f} {y:.1f} l S")
    y -= 14
    for s, st in shipped:
        p.text(ML, y, s, 8.5, INK, False)
        p.text(ML + 360, y, st, 8.5, TEAL_D, True)
        y -= 14
    y -= 10
    y = p.h2(y, "Fill before third-party use")
    left = [
        "Paying org count and MRR / ARR",
        "Free listed vs paying; facility-count mix; DFY attach",
        "Join to Search-only vs claimed conversion",
        "Live vs frozen; verify-on-time; completeness",
    ]
    right = [
        "Link reopens, referral clicks, Search volume",
        "Team, burn, runway",
        "Named date for the free/paid boundary",
        "Live Stripe amounts vs this catalog",
    ]
    card(p, ML, y - 100, 250, 100, "From Stripe and admin", "1. " + "  2. ".join(left))
    card(p, ML + 266, y - 100, 250, 100, "From ops and the books", "5. " + "  6. ".join(right))
    y -= 124
    p.text(ML, y, "CenterLinked Inc.  |  Florida  |  Confidential  |  September 14, 2026  |  www.centerlinked.com", 8, TEAL_D, True)
    y -= 14
    p.para(ML, y, "Sources: live product, PRINCIPLES.md, PROJECT.md, src/lib/pricing.ts, Terms of Service 8, src/lib/verification.ts. This plan does not invent customers, revenue, conversion, burn, or headcount.", 516, 8, 10.5, MUTED)

    OUT.write_bytes(p.finish())
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes, {len(p.pages)} pages)")


if __name__ == "__main__":
    build()
