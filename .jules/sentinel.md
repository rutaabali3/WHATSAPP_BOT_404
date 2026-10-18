## 2025-05-18 - Empty String Authorization Bypass in Digit-Normalizing JID Checks
**Vulnerability:** Normalizing WhatsApp JIDs and owner phone numbers by removing non-digit characters (`replace(/\D/g, '')`) converted empty, non-numeric, or unconfigured strings into empty strings (`""`). Comparing normalized JIDs with `"" === ""` evaluated to true, bypassing owner authorization checks.
**Learning:** Normalization functions must validate that both target and expected identifiers result in non-empty values before performing equality comparison.
**Prevention:** Always verify that both normalized values are non-empty strings before returning true in permission validation helpers.
