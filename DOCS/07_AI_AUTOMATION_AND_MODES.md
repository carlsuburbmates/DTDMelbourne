# AI Automation & Modes (SSOT Final Aligned)

> OUT OF SCOPE — NON-CANONICAL: Admin panel / AI automation is not part of the current SSOT. Do not implement.

> **SSOT Alignment:** This document is a derived reference. Canonical requirements live in `DOCS/SSOT/SSOT_FINAL.md`.

---

## Reference Notes (Non-Canonical)
- The platform targets AI-automation on the admin side with minimal manual oversight.
- Emergency routing and directory matching must respect SSOT invariants (age-first, suburb-first, enum-only).

---

## Non-Negotiable Rules (From SSOT)
- ABN lookup credentials/GUID are server-only and must never be exposed client-side
- ABN verification is optional; verified badge only for Active ABNs
- Emergency flows isolated from monetisation

---

## DECISION REQUIRED (Not in SSOT)
- AI provider(s), model selection, and prompt strategies
- AI fallback rules and operational alerts
