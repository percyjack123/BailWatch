# local_explainer.py
# ================================================================
#  LOCAL AI EXPLANATION ENGINE
#  No API key. No internet. No quota. Works 100% offline.
#
#  HOW IT WORKS
#  ------------
#  1. Reads the bias scores and breakdown from bias_engine.py
#  2. Runs rule-based analysis (what the numbers actually mean)
#  3. Generates a professional explanation using smart templates
#  4. Produces key findings + recommendations based on the data
#
#  This is a HYBRID model:
#    - Rule engine    → understands the numbers
#    - Template engine → writes professional sentences
#    - Logic layer    → picks the right severity language
#
#  OUTPUT is identical to what Gemini would return — same JSON shape.
#  So app.py needs ZERO changes when switching between local/Gemini.
# ================================================================


# ── Severity language maps ───────────────────────────────────────
_SEVERITY_WORDS = {
    "HIGH":     ["significant", "serious", "dramatic", "stark"],
    "MODERATE": ["notable", "considerable", "meaningful", "observable"],
    "LOW":      ["slight", "marginal", "modest", "mild"],
}

_FLAG_VERDICTS = {
    "HIGH":     "serious systemic bias",
    "MODERATE": "moderate disparity",
    "LOW":      "minor variation",
}

_FEATURE_LABELS = {
    "incomeLevel":          ("income level", "income group", "economic status"),
    "legalRepresentation":  ("legal representation", "access to a lawyer", "legal support"),
    "region":               ("location", "urban/rural divide", "geographic region"),
    "socialGroup":          ("social/ethnic group", "community background", "social category"),
}


# ================================================================
#  MAIN FUNCTION — call this from app.py
#
#  Parameters
#  ----------
#  bias_scores : dict   e.g. { "incomeLevel": 2.0, "region": 1.3 }
#  all_results : list   full breakdown from bias_engine.py
#  country     : str    e.g. "INDIA", "USA", "UK"
#
#  Returns
#  -------
#  dict with keys: explanation, keyFindings, recommendations,
#                  severity, sdgRelevance
#  (same shape as Gemini response — drop-in replacement)
# ================================================================
def generate_local_explanation(
        bias_scores: dict,
        all_results: list,
        country: str = "the jurisdiction") -> dict:

    country_label = country.title() if country else "this jurisdiction"

    # ── Analyse the data ────────────────────────────────────────
    analysis    = _analyse_results(all_results, bias_scores)
    worst       = analysis["worst_feature"]
    overall_sev = analysis["overall_severity"]

    # ── Build explanation paragraphs ────────────────────────────
    para1 = _build_para1(analysis, country_label)
    para2 = _build_para2(analysis, country_label)
    para3 = _build_para3(analysis, overall_sev)

    explanation = f"{para1}\n\n{para2}\n\n{para3}"

    # ── Build key findings ───────────────────────────────────────
    findings = _build_findings(analysis, country_label)

    # ── Build recommendations ────────────────────────────────────
    recommendations = _build_recommendations(analysis)

    # ── SDG 16 link ──────────────────────────────────────────────
    sdg = _build_sdg(overall_sev, worst, country_label)

    return {
        "explanation":     explanation,
        "keyFindings":     findings,
        "recommendations": recommendations,
        "severity":        overall_sev,
        "sdgRelevance":    sdg,
        "source":          "local_engine"   # lets you know it came from local model
    }


# ================================================================
#  ANALYSIS LAYER
#  Extracts meaningful insights from raw bias numbers
# ================================================================
def _analyse_results(all_results: list, bias_scores: dict) -> dict:

    # Group results by feature
    by_feature = {}
    for r in all_results:
        by_feature.setdefault(r["feature"], []).append(r)

    feature_summaries = {}

    for feature, results in by_feature.items():
        # Find best and worst groups for this feature
        best  = max(results, key=lambda x: x["bail_rate"])
        worst = min(results, key=lambda x: x["bail_rate"])
        max_ratio = max(r["ratio"] for r in results)
        flags = [r["flag"] for r in results]
        feature_flag = "HIGH" if "HIGH" in flags else "MODERATE" if "MODERATE" in flags else "LOW"

        labels = _FEATURE_LABELS.get(feature, (feature, feature, feature))

        feature_summaries[feature] = {
            "label":        labels[0],
            "label2":       labels[1],
            "best_group":   best["group_name"],
            "best_rate":    best["bail_rate"],
            "worst_group":  worst["group_name"],
            "worst_rate":   worst["bail_rate"],
            "max_ratio":    max_ratio,
            "difference":   round(best["bail_rate"] - worst["bail_rate"], 4),
            "flag":         feature_flag,
            "all_groups":   results,
        }

    # Overall severity
    all_flags = [s["flag"] for s in feature_summaries.values()]
    if "HIGH" in all_flags:
        overall_sev = "HIGH"
    elif "MODERATE" in all_flags:
        overall_sev = "MODERATE"
    else:
        overall_sev = "LOW"

    # Worst feature = highest ratio
    worst_feature = max(feature_summaries.items(),
                        key=lambda x: x[1]["max_ratio"])[0] if feature_summaries else None

    return {
        "by_feature":       feature_summaries,
        "overall_severity": overall_sev,
        "worst_feature":    worst_feature,
        "feature_count":    len(feature_summaries),
        "high_count":       all_flags.count("HIGH"),
        "moderate_count":   all_flags.count("MODERATE"),
    }


# ================================================================
#  PARAGRAPH BUILDERS
# ================================================================

def _build_para1(analysis: dict, country: str) -> str:
    """Paragraph 1: What was found — the numbers."""
    sev      = analysis["overall_severity"]
    by_feat  = analysis["by_feature"]
    sev_word = _SEVERITY_WORDS[sev][0]

    if not by_feat:
        return f"Bias analysis was conducted on bail decision data from {country}."

    # Lead with the worst feature
    worst_key = analysis["worst_feature"]
    if worst_key and worst_key in by_feat:
        w = by_feat[worst_key]
        best_pct  = round(w["best_rate"]  * 100, 1)
        worst_pct = round(w["worst_rate"] * 100, 1)
        ratio     = round(w["max_ratio"], 2)

        para = (
            f"Analysis of bail decision data from {country} reveals {sev_word} disparities "
            f"across multiple demographic features. The most pronounced disparity is found in "
            f"{w['label']}: defendants in the '{w['best_group']}' group receive bail "
            f"{best_pct}% of the time, compared to only {worst_pct}% for the '{w['worst_group']}' "
            f"group — a ratio of {ratio}x, which is classified as {_FLAG_VERDICTS[w['flag']]}."
        )
    else:
        para = f"Analysis of bail decision data from {country} reveals disparities across demographic features."

    return para


def _build_para2(analysis: dict, country: str) -> str:
    """Paragraph 2: Real-world consequences for defendants."""
    by_feat = analysis["by_feature"]
    sev     = analysis["overall_severity"]
    parts   = []

    for feature, s in by_feat.items():
        if s["flag"] in ("HIGH", "MODERATE"):
            diff_pct = round(s["difference"] * 100, 1)
            parts.append(
                f"defendants disadvantaged by {s['label2']} face a {diff_pct} percentage-point "
                f"lower chance of receiving bail"
            )

    if parts:
        consequence_str = "; ".join(parts[:2])
        para = (
            f"In practice, this means {consequence_str}. "
            f"For undertrial defendants, bail denial leads to prolonged pretrial detention, "
            f"loss of employment, family separation, and reduced ability to prepare a legal defence. "
            f"These compounding disadvantages create a cycle where systemic bias in bail decisions "
            f"deepens existing social and economic inequalities."
        )
    else:
        para = (
            f"While disparities are within acceptable ranges, any variation in bail rates "
            f"across demographic groups warrants ongoing monitoring to prevent future bias from emerging."
        )

    return para


def _build_para3(analysis: dict, sev: str) -> str:
    """Paragraph 3: Verdict and recommendation."""
    verdicts = {
        "HIGH": (
            "Overall, this dataset exhibits significant systemic bias in bail decisions. "
            "The disparities found are large enough to indicate that protected characteristics "
            "such as income and legal representation status are influencing outcomes in ways "
            "that cannot be justified by case severity alone. "
            "Immediate policy intervention is recommended, including mandatory bias audits "
            "and standardised bail assessment criteria that exclude socioeconomic proxies."
        ),
        "MODERATE": (
            "Overall, this dataset shows moderate disparity in bail decisions across demographic groups. "
            "While not at a critical threshold, the patterns identified are statistically meaningful "
            "and warrant attention. Regular auditing of bail decisions, combined with enhanced "
            "legal aid access for underrepresented groups, would help reduce these disparities over time."
        ),
        "LOW": (
            "Overall, this dataset shows relatively balanced bail decision rates across demographic groups. "
            "The disparities observed fall within acceptable statistical ranges. "
            "Continued monitoring is recommended to ensure these equitable patterns are maintained "
            "as case volumes and compositions change."
        ),
    }
    return verdicts.get(sev, verdicts["LOW"])


# ================================================================
#  KEY FINDINGS BUILDER
# ================================================================
def _build_findings(analysis: dict, country: str) -> list:
    findings = []
    by_feat  = analysis["by_feature"]

    for feature, s in by_feat.items():
        best_pct  = round(s["best_rate"]  * 100, 1)
        worst_pct = round(s["worst_rate"] * 100, 1)
        ratio     = round(s["max_ratio"], 2)

        if s["flag"] == "HIGH":
            findings.append(
                f"CRITICAL — {s['label'].title()} bias: '{s['worst_group']}' defendants receive bail "
                f"only {worst_pct}% of the time vs {best_pct}% for '{s['best_group']}' "
                f"(ratio: {ratio}x). This exceeds the 2.0x HIGH bias threshold."
            )
        elif s["flag"] == "MODERATE":
            findings.append(
                f"MODERATE — {s['label'].title()} disparity: '{s['worst_group']}' group bail rate "
                f"({worst_pct}%) is {ratio}x lower than '{s['best_group']}' ({best_pct}%). "
                f"Above the 1.5x concern threshold."
            )
        else:
            findings.append(
                f"LOW — {s['label'].title()}: bail rates range from {worst_pct}% to {best_pct}% "
                f"(ratio: {ratio}x). Within acceptable range."
            )

    if analysis["overall_severity"] == "HIGH":
        findings.append(
            f"OVERALL: Dataset is classified as BIASED. "
            f"{analysis['high_count']} feature(s) exceed the critical 2.0x disparity threshold."
        )
    elif analysis["overall_severity"] == "MODERATE":
        findings.append(
            f"OVERALL: Dataset shows MODERATE bias. "
            f"{analysis['moderate_count']} feature(s) show concerning disparity patterns."
        )
    else:
        findings.append("OVERALL: Dataset is classified as FAIR — no critical disparities detected.")

    return findings[:4]   # cap at 4 findings


# ================================================================
#  RECOMMENDATIONS BUILDER
# ================================================================
def _build_recommendations(analysis: dict) -> list:
    recs = []
    by_feat = analysis["by_feature"]
    sev     = analysis["overall_severity"]

    # Feature-specific recommendations
    for feature, s in by_feat.items():
        if feature == "incomeLevel" and s["flag"] in ("HIGH", "MODERATE"):
            recs.append(
                "Remove income-based surety and financial guarantee requirements from bail criteria. "
                "Replace with community supervision and electronic monitoring as alternatives to cash bail."
            )
        if feature == "legalRepresentation" and s["flag"] in ("HIGH", "MODERATE"):
            recs.append(
                "Mandate free legal aid for all undertrial defendants at the bail hearing stage. "
                "Unrepresented defendants should automatically receive duty counsel before any bail decision is made."
            )
        if feature == "region" and s["flag"] in ("HIGH", "MODERATE"):
            recs.append(
                "Standardise bail assessment procedures across urban and rural courts. "
                "Rural court disparity may reflect resource gaps — invest in legal aid access in underserved areas."
            )
        if feature == "socialGroup" and s["flag"] in ("HIGH", "MODERATE"):
            recs.append(
                "Introduce anonymised case review for bail decisions to reduce implicit bias based on social identity. "
                "Conduct quarterly disparity audits disaggregated by ethnicity and social group."
            )

    # General recommendations based on severity
    if sev == "HIGH":
        recs.append(
            "Conduct an immediate independent judicial review of bail decision patterns. "
            "Suspend use of any algorithmic or risk-score tools until bias audits are complete."
        )
    elif sev == "MODERATE":
        recs.append(
            "Implement a six-month monitoring programme with monthly disparity reporting "
            "shared with judicial oversight bodies and civil society organisations."
        )

    # Always include SDG recommendation
    recs.append(
        "Publish quarterly public bail disparity reports aligned with SDG 16.3 targets on "
        "equal access to justice, enabling civil society accountability and public oversight."
    )

    return recs[:4]   # cap at 4


# ================================================================
#  SDG 16 RELEVANCE BUILDER
# ================================================================
def _build_sdg(sev: str, worst_feature: str, country: str) -> str:
    label = _FEATURE_LABELS.get(worst_feature, (worst_feature,))[0] if worst_feature else "multiple factors"

    templates = {
        "HIGH": (
            f"These findings directly undermine SDG 16.3 (equal access to justice for all): "
            f"the {label}-based disparity in {country} bail decisions shows that fundamental "
            f"legal protections are not being applied equally, violating the principle of equality before the law."
        ),
        "MODERATE": (
            f"These findings present a concern for SDG 16.3 (access to justice): "
            f"moderate disparities in {country} bail decisions based on {label} indicate "
            f"that progress toward equal justice remains incomplete and requires targeted intervention."
        ),
        "LOW": (
            f"While disparities are within acceptable ranges, continued monitoring supports "
            f"SDG 16.3 commitments by ensuring {country}'s bail system remains accountable, "
            f"transparent, and equitable for all defendants regardless of background."
        ),
    }
    return templates.get(sev, templates["LOW"])
