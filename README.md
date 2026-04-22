# BailWatch — Judicial Bias Audit System

> Expose hidden bias in bail decisions. Upload a dataset. Receive an irrefutable verdict.
> **Google Solution Challenge 2026 · SDG 16.3 — Equal Access to Justice**

---

## What It Does

BailWatch analyses bail court records and detects statistically significant disparities
in bail outcomes across income level, legal representation, location, and social group.
It uses Google Gemini AI to generate plain-English explanations, key findings,
and concrete policy recommendations.

---

## Google Technologies

| Technology | How Used |
|-----------|----------|
| **Gemini API** (`gemini-2.0-flash`) | Generates audit explanations, key findings, recommendations, and SDG 16.3 relevance statements |

Set `EXPLANATION_ENGINE=gemini` in `.env` with your `GEMINI_API_KEY` to enable.
Defaults to a local rule-based engine if the key is absent or quota is exhausted (`EXPLANATION_ENGINE=auto` tries Gemini first, falls back automatically).

---

## Project Structure
bailwatch/
├── frontend/                              ← React + Vite (Port 5173)
│   └── src/
│       ├── pages/
│       │   ├── AboutPage.jsx              ← Landing page + SDG context (route: /)
│       │   ├── UploadPage.jsx             ← CSV upload + live stats (route: /audit)
│       │   ├── ResultsPage.jsx            ← Audit results + chart + export (route: /results)
│       │   └── HistoryPage.jsx            ← Past audits browser (route: /history)
│       ├── components/
│       │   ├── BiasChart.jsx              ← Canvas bar chart (no dependencies)
│       │   ├── BiasMeter.jsx              ← Animated ratio meter
│       │   ├── BreakdownTable.jsx         ← Full group breakdown table
│       │   ├── VerdictStamp.jsx           ← Animated verdict stamp
│       │   ├── Navbar.jsx                 ← Navigation with SDG 16.3 label
│       │   ├── LoadingOverlay.jsx
│       │   └── Toast.jsx
│       └── utils/
│           ├── biasUtils.js               ← Shared helpers + fallback explainer
│           └── exportReport.js            ← JSON + TXT report export
│
├── src/main/java/com/bailwatch/           ← Spring Boot (Port 8080)
│   ├── controller/
│   │   ├── AuditController.java           ← /upload /run /stats /history
│   │   ├── BailRecordController.java
│   │   └── GlobalExceptionHandler.java
│   ├── service/
│   │   ├── BiasAuditService.java          ← Orchestrates Flask call
│   │   └── CsvIngestionService.java       ← CSV parsing + DB save
│   ├── model/BailRecord.java
│   ├── repository/BailRecordRepository.java
│   └── dto/BiasResultDto.java
├── src/main/resources/application.properties
├── pom.xml
│
├── app.py                                 ← Flask ML API (Port 5000)
├── bias_engine.py                         ← Disparity ratio engine
├── local_explainer.py                     ← Offline explanation engine
├── pipeline.py                            ← CSV cleaning + socialGroup mapping
├── requirements.txt
│
├── ARCHITECTURE.md                        ← System diagram + data flow
├── DEMO.md                                ← 2-minute demo script
└── README.md

---

## Quick Start

### 1 — Database
```sql
CREATE DATABASE bailwatch;
```

### 2 — Flask ML API
```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add GEMINI_API_KEY if available
python app.py
# → http://localhost:5000
```

### 3 — Spring Boot
```bash
export DB_URL=jdbc:postgresql://localhost:5432/bailwatch
export DB_USER=postgres
export DB_PASS=your_password
./mvnw spring-boot:run
# → http://localhost:8080
```

### 4 — Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audit/upload` | Upload CSV → returns `datasetId` |
| `GET` | `/api/audit/run/{datasetId}` | Run bias audit → returns full result |
| `GET` | `/api/audit/stats` | Live record counts for upload page |
| `GET` | `/api/audit/history` | All past audits, newest first |

---

## Bias Dimensions

| Feature | Groups Compared |
|---------|----------------|
| Income Level | Low / Medium / High |
| Legal Representation | Yes / No |
| Location Type | Urban / Rural |
| Social / Ethnic Group | Religion / Ethnicity / Race (where available) |

## Severity Thresholds

| Flag | Ratio | Meaning |
|------|-------|---------|
| HIGH | ≥ 2.0× | Serious systemic bias — immediate action required |
| MODERATE | ≥ 1.5× | Concerning disparity — monitoring and reform needed |
| LOW | < 1.5× | Within acceptable range |

## Sample Datasets

| File | Jurisdiction | Records |
|------|-------------|---------|
| `bailwatch_india_final.csv` | 🇮🇳 India | 2,000 |
| `bailwatch_uk_final.csv` | 🇬🇧 United Kingdom | 1,000 |
| `bailwatch_usa_final.csv` | 🇺🇸 United States | 1,000 |

---

*BailWatch — BUILD 2.4.1 — Google Solution Challenge 2026*
*For research and accountability purposes only. Data is not legal advice.*