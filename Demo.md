# BailWatch — Demo Guide

> Complete bias audit walkthrough in under 2 minutes.
> Google Solution Challenge 2026 · SDG 16.3

---

## Prerequisites — All 3 services running

| Service | Command | Port |
|---------|---------|------|
| Flask ML API | `python app.py` | 5000 |
| Spring Boot | `./mvnw spring-boot:run` | 8080 |
| React Frontend | `cd frontend && npm run dev` | 5173 |

Open **http://localhost:5173**

---

## Demo Script

### 1 — About Page `/ ` (30 seconds)
The app opens on the landing page. Point out:
- **"Justice should not depend on your income"** — frames the problem immediately
- **11M+ pretrial detainees** stat — establishes real-world scale
- **SDG 16.3 quote** — links directly to the UN goal
- **Technology stack** — explicitly shows Gemini API
- Click **"Run a Bias Audit"**

---

### 2 — Upload `/audit` (20 seconds)
- Drag and drop **`bailwatch_india_final.csv`** into the drop zone
- Show the live stats updating — record counts pulled from DB in real time
- Click **"Run Bias Audit"**
- Loading overlay shows pipeline stages: Upload → Ingest → Calculate → Verdict

---

### 3 — Results `/results` (50 seconds)

Walk through each section top to bottom:

| Section | What to say |
|---------|-------------|
| **Verdict + stamp** | "Instant binary verdict — BIASED or FAIR" |
| **Key sentence** | "One line that captures the single worst finding" |
| **Jurisdiction badge** | "Auto-detected from CSV — no config needed" |
| **Bias meters** | "Animated ratio bars — income shows ~2.0× disparity" |
| **Bar chart** | "Visual comparison of bail rates per group, colour-coded by severity" |
| **Breakdown table** | "Every group, every feature, every number" |
| **Key Findings** | "Gemini-generated, data-backed, numbered findings" |
| **Recommendations** | "Concrete policy actions — not vague suggestions" |
| **SDG 16.3 block** | "Direct link to the sustainable development goal" |
| **Export buttons** | Click JSON — downloads a complete audit report file |

---

### 4 — History `/history` (20 seconds)
- Click **History** in the navbar
- Shows all previously uploaded datasets with country flag and record count
- Click **Re-run** on any row — re-fires the full audit and navigates to results
- "Every audit is stored — nothing is lost between sessions"

---

## Expected Results by Dataset

| Dataset | Verdict | Strongest Bias Feature | Max Ratio |
|---------|---------|----------------------|-----------|
| `bailwatch_india_final.csv` | FAIR | Income Level | ~2.0× |
| `bailwatch_uk_final.csv` | FAIR | Legal Representation | ~1.17× |
| `bailwatch_usa_final.csv` | FAIR | Legal Representation | ~1.30× |

> India is the most impactful demo — income ratio is right on the HIGH threshold.

---

## Key Talking Points

- **No black box** — every number is shown and explained
- **Gemini-powered** — AI turns raw ratios into human-readable narratives
- **Multi-jurisdiction** — same engine, three countries, zero reconfiguration
- **Actionable output** — recommendations are concrete, not generic
- **Exportable** — JSON/TXT reports can be submitted to courts or policymakers
- **SDG 16.3 aligned** — equal access to justice is the explicit goal
- **Offline fallback** — works without Gemini quota via local engine

---

*BailWatch — Google Solution Challenge 2026*