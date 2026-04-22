# app.py  —  BailWatch ML API  (Gemini-free, hybrid model only)
# Run with: python app.py

import os, json, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from bias_engine import analyse_feature, FEATURES_TO_ANALYSE
from local_explainer import generate_local_explanation

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests (required for deployment)


# ── FIX F1: Default to local so no external API key is needed ────────────────
# Set EXPLANATION_ENGINE=gemini in .env ONLY if you want to re-enable Gemini.
ENGINE       = os.getenv("EXPLANATION_ENGINE", "local")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Simple in-memory cache: dataset_id -> explanation dict
_explanation_cache = {}

print(f"[BailWatch] Engine: {ENGINE} | Model: {GEMINI_MODEL}")


# ================================================================
#  EXPLANATION ROUTER
# ================================================================
def generate_explanation(bias_scores, all_results, country, dataset_id=None):

    if dataset_id and dataset_id in _explanation_cache:
        print(f"[BailWatch] Cache hit for dataset {dataset_id}")
        return _explanation_cache[dataset_id]

    engine = ENGINE.lower()

    if engine == "gemini":
        result = _call_gemini(bias_scores, all_results, country)
        if result.get("source") == "gemini_error":
            msg = result.get("explanation", "")
            if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                result["explanation"] = (
                    "Gemini quota exhausted. Set EXPLANATION_ENGINE=local in .env to use the offline engine."
                )
            return result

    elif engine == "auto":
        # ── FIX F1: Wrap Gemini attempt in a try so TypeError on missing key
        #    doesn't escape — local engine is the guaranteed fallback ──────────
        try:
            result = _call_gemini(bias_scores, all_results, country)
        except Exception as e:
            print(f"[BailWatch] Gemini import/init error → local engine: {e}")
            result = {"source": "gemini_error", "explanation": str(e)}

        if result.get("source") == "gemini_error":
            print("[BailWatch] Gemini failed → local engine")
            result = generate_local_explanation(bias_scores, all_results, country)

    else:
        # "local" — default, always works, no API key needed
        result = generate_local_explanation(bias_scores, all_results, country)

    if dataset_id:
        _explanation_cache[dataset_id] = result
        print(f"[BailWatch] Cached explanation for dataset {dataset_id}")

    return result


# ================================================================
#  GEMINI ENGINE  (only called if ENGINE=gemini or ENGINE=auto)
# ================================================================
def _call_gemini(bias_scores, all_results, country):
    try:
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"source": "gemini_error",
                    "explanation": "GEMINI_API_KEY not set in .env"}

        client = genai.Client(api_key=api_key)

        prompt = f"""You are an AI fairness auditor for BailWatch (Google Developer Solution Challenge, SDG 16: Justice).
Country: {country}
Bias Scores (feature -> worst ratio): {bias_scores}
Breakdown: {all_results}
FLAGS: HIGH(>=2.0)=serious, MODERATE(>=1.5)=concerning, LOW=acceptable

Respond ONLY with valid JSON, no markdown:
{{
  "explanation": "3 clear paragraphs: 1) which groups affected + numbers, 2) real-world consequences, 3) verdict + recommendation",
  "keyFindings": ["finding with numbers", "finding with numbers", "finding with numbers"],
  "recommendations": ["actionable rec 1", "actionable rec 2", "actionable rec 3"],
  "severity": "HIGH or MODERATE or LOW",
  "sdgRelevance": "one sentence linking to SDG 16.3 equal access to justice"
}}"""

        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:-1]).strip()

        parsed = json.loads(text)
        parsed["source"] = "gemini"
        print(f"[BailWatch] Gemini OK — severity={parsed.get('severity')}")
        return parsed

    except Exception as e:
        msg = str(e)
        print(f"[BailWatch] Gemini error: {type(e).__name__}: {msg[:100]}")
        return {"source": "gemini_error", "explanation": msg}


# ================================================================
#  POST /analyze
# ================================================================
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        body = request.get_json(silent=True)
        if not body or "records" not in body:
            return jsonify({"error": "Missing records"}), 400

        records = body["records"]
        if not records:
            return jsonify({"error": "Empty records"}), 400

        country    = body.get("country", "UNKNOWN").upper()

        # ── FIX F2: dataset_id comes from the first record (Spring now injects it) ──
        dataset_id = None
        if records:
            raw_id = records[0].get("datasetId")
            if raw_id is not None:
                dataset_id = int(raw_id)

        # Run bias engine
        all_results = []
        for feature in FEATURES_TO_ANALYSE:
            all_results.extend(analyse_feature(records, feature))

        # Bias scores — worst ratio per feature
        bias_scores = {}
        for r in all_results:
            f = r["feature"]
            if f not in bias_scores or r["ratio"] > bias_scores[f]:
                bias_scores[f] = round(r["ratio"], 4)

        # ── Guard: if bias engine returned nothing, return a safe error ──────
        if not all_results:
            return jsonify({
                "error": "Bias engine produced no results. Check that incomeLevel, "
                         "region, and legalRepresentation columns exist in your CSV."
            }), 422

        verdict = "BIASED" if any(r["flag"] == "HIGH" for r in all_results) else "FAIR"

        # Generate explanation — always returns a complete dict
        exp = generate_explanation(bias_scores, all_results, country, dataset_id)

        # Compute keySentence — one strong summary line for the results header
        key_sentence = _build_key_sentence(bias_scores, all_results, verdict, country)

        return jsonify({
            "datasetId":       dataset_id,
            "country":         country,
            "biasScores":      bias_scores,
            "overallVerdict":  verdict,
            "breakdown":       all_results,
            "explanation":     exp.get("explanation") or "Analysis complete.",
            "keyFindings":     exp.get("keyFindings")     or [],
            "recommendations": exp.get("recommendations") or [],
            "severity":        exp.get("severity")        or verdict,
            "sdgRelevance":    exp.get("sdgRelevance")    or "",
            "engine":          exp.get("source")          or "local_engine",
            "keySentence":     key_sentence,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "UP", "service": "BailWatch ML API",
                    "engine": ENGINE, "model": GEMINI_MODEL})


# ================================================================
#  KEY SENTENCE BUILDER
#  Returns one punchy sentence summarising the most critical finding
# ================================================================
def _build_key_sentence(bias_scores: dict, all_results: list, verdict: str, country: str) -> str:
    if not all_results:
        return "No significant bias pattern detected in this dataset."

    # Find the single worst-ratio row across all results
    worst = max(all_results, key=lambda r: r["ratio"])
    feature_labels = {
        "incomeLevel":         "income level",
        "legalRepresentation": "legal representation",
        "region":              "location (urban vs rural)",
        "socialGroup":         "social or ethnic group",
    }
    feature_label = feature_labels.get(worst["feature"], worst["feature"].replace("_", " "))
    best_row = max(
        [r for r in all_results if r["feature"] == worst["feature"]],
        key=lambda r: r["bail_rate"]
    )
    worst_pct = round(worst["bail_rate"] * 100, 1)
    best_pct  = round(best_row["bail_rate"] * 100, 1)
    ratio     = round(worst["ratio"], 1)
    country_label = country.title() if country and country != "UNKNOWN" else "this jurisdiction"

    if verdict == "BIASED":
        return (
            f"In {country_label}, defendants disadvantaged by {feature_label} receive bail only "
            f"{worst_pct}% of the time versus {best_pct}% for the most favoured group — "
            f"a {ratio}× disparity flagged as {worst['flag']} severity."
        )
    else:
        return (
            f"Bail decision rates in {country_label} show no critical disparities across "
            f"income, legal representation, or location — the highest ratio observed is {ratio}×."
        )


if __name__ == "__main__":
    app.run(port=5000, debug=True)