# bias_engine.py

# These are the columns we analyse for bias.
# Each one is a "feature" — we check if bail rates differ across its values.
# socialGroup is added if it exists in the dataset (pipeline maps ethnicity/religion → socialGroup)
FEATURES_TO_ANALYSE = ["incomeLevel", "region", "legalRepresentation", "socialGroup"]


def calculate_bail_rate(records):
    """
    Given a list of records, returns the proportion where bail was granted.

    Example:
        records = [{"bailGranted": 0}, {"bailGranted": 0}, {"bailGranted": 1}, {"bailGranted": 0}]
        Result: 1/4 = 0.25
    """
    if len(records) == 0:
        return 0.0
    granted = sum(1 for r in records if r["bailGranted"] == 1)
    return round(granted / len(records), 4)


def determine_flag(ratio):
    """
    Given a ratio (how many times more likely one group gets bail),
    return a severity flag.

    ratio >= 2.0  → HIGH   (group A is 2x+ more likely to get bail than group B)
    ratio >= 1.5  → MODERATE
    else          → LOW
    """
    if ratio >= 2.0:
        return "HIGH"
    elif ratio >= 1.5:
        return "MODERATE"
    else:
        return "LOW"


def analyse_feature(records, feature_key):
    """
    For one feature (e.g. "incomeLevel"), compares bail rates across all groups.

    Returns a list of result dictionaries, one per group.

    Example for incomeLevel:
    - low group:  rate=0.25
    - high group: rate=1.0
    → ratio = 1.0 / 0.25 = 4.0  (high earners 4x more likely to get bail)
    → difference = 1.0 - 0.25 = 0.75
    → flag = HIGH
    """

    # STEP 1: Group records by their value for this feature
    # e.g. groups = {"low": [...records...], "high": [...records...], "medium": [...records...]}
    groups = {}
    for record in records:
        value = record.get(feature_key)
        if value is None:
            continue
        if value not in groups:
            groups[value] = []
        groups[value].append(record)

    if len(groups) < 2:
        # We need at least 2 groups to compare. Skip if only 1 exists.
        return []

    # STEP 2: Calculate bail rate for each group
    rates = {}
    for group_name, group_records in groups.items():
        rates[group_name] = calculate_bail_rate(group_records)

    # STEP 3: Find the highest and lowest bail rates for ratio calculation
    max_rate = max(rates.values())
    min_rate = min(rates.values())

    # STEP 4: Build result rows — one per group
    results = []
    for group_name, rate in rates.items():

        # Ratio: how does this group compare to the best-off group?
        # We divide max_rate by this group's rate.
        # If this group HAS the max rate, ratio = 1.0 (no disparity for them)
        if rate == 0:
            # Avoid dividing by zero. If this group has 0% bail rate, ratio is very high.
            ratio = round(max_rate / 0.0001, 4) if max_rate > 0 else 1.0
        else:
            ratio = round(max_rate / rate, 4)

        difference = round(max_rate - rate, 4)
        flag = determine_flag(ratio)

        results.append({
            "feature":    feature_key,
            "group_name": group_name,
            "bail_rate":  rate,
            "ratio":      ratio,
            "difference": difference,
            "flag":       flag
        })

    return results


def run_bias_analysis(clean_records, dataset_id, cursor, conn):
    """
    Runs the full bias analysis across all features.
    Saves results to the bias_results table.
    Returns the results as a list for the API response.
    """
    all_results = []

    for feature in FEATURES_TO_ANALYSE:
        feature_results = analyse_feature(clean_records, feature)
        all_results.extend(feature_results)

    # Save each result row to the database
    for result in all_results:
        cursor.execute("""
            INSERT INTO bias_results
                (dataset_id, feature, group_name, bail_rate, ratio, difference, flag)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            dataset_id,
            result["feature"],
            result["group_name"],
            result["bail_rate"],
            result["ratio"],
            result["difference"],
            result["flag"]
        ))

    conn.commit()
    return all_results