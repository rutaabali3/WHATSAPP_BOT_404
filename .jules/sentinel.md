## 2025-05-18 - Authorization Bypass via Unsanitized Empty String JID Normalization
**Vulnerability:** `isOwnerJid` normalized WhatsApp JIDs and owner numbers by stripping non-digit characters (`.replace(/\D/g, '')`). When provided non-numeric JIDs (e.g., `status@broadcast`) or when `ownerNumber` was unconfigured/empty, both normalized values evaluated to empty strings (`"" === ""`), evaluating to `true` and granting owner authorization.
**Learning:** Normalization logic that strips non-conforming characters can turn invalid or empty inputs into matching defaults (like empty strings) if string length and presence aren't validated after stripping.
**Prevention:** Always validate that normalized strings are non-empty before checking equality when performing access control logic.
