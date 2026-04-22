# pipeline.py
import pandas as pd

# These are the REQUIRED columns your CSV must have.
# Your actual CSVs have more columns — we only keep what we need.
REQUIRED_COLUMNS = {
    "income_level",
    "legal_representation",
    "bail_granted",
    "location_type"   # this becomes "region" after cleaning
}


def clean_csv(filepath):
    """
    Takes a CSV file path.
    Returns a list of clean dictionaries, one per row.

    Example output:
    [
        {
            "incomeLevel": "low",
            "region": "rural",
            "legalRepresentation": "no",
            "bailGranted": 0,
            "bailAmount": 5000,
            "crimeType": "theft",
            "severityCategory": "low"
        },
        ...
    ]
    """

    # STEP 1: Read the CSV into a table (called a DataFrame)
    df = pd.read_csv(filepath)

    # STEP 2: Make all column names lowercase so "Income_Level" and "income_level" both work
    df.columns = df.columns.str.lower()

    # STEP 3: Check that the columns we need are actually in the file
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing these columns: {missing}")

    # STEP 4: Drop rows that are missing critical values
    # (we can't analyse a record if we don't know if bail was granted or not)
    df = df.dropna(subset=["income_level", "legal_representation", "bail_granted", "location_type"])

    # STEP 5: Normalize text values to lowercase and strip extra spaces
    # This fixes problems like "Low" vs "low" vs "LOW " — they all become "low"
    text_columns = ["income_level", "legal_representation", "location_type"]
    for col in text_columns:
        df[col] = df[col].str.lower().str.strip()

    # STEP 6: Normalize legal_representation to exactly "yes" or "no"
    # Some CSVs might say "Yes", "YES", "y" — we unify them
    df["legal_representation"] = df["legal_representation"].map(
        lambda x: "yes" if str(x).lower() in ["yes", "y", "true", "1"] else "no"
    )

    # STEP 7: Make sure bail_granted is 0 or 1 (integer)
    df["bail_granted"] = pd.to_numeric(df["bail_granted"], errors="coerce")
    df = df.dropna(subset=["bail_granted"])  # drop rows where bail_granted is not a number
    df["bail_granted"] = df["bail_granted"].astype(int)

    # STEP 8: Handle optional columns (may or may not exist depending on country)
    # We use .get() style with fallback to None if column doesn't exist
    bail_amount_col = None
    for possible_name in ["bail_amount_gbp", "bail_amount_inr", "bail_amount_usd", "bail_amount"]:
        if possible_name in df.columns:
            bail_amount_col = possible_name
            break

    # STEP 9: Build the clean output list
    # This is the format that NEVER changes (as per your build guide)
    clean_records = []
    for _, row in df.iterrows():

        # Determine socialGroup: prefer religion (India), then ethnicity (UK), then race_ethnicity (USA)
        social_group = None
        for col in ["religion", "ethnicity", "race_ethnicity", "race"]:
            if col in df.columns and pd.notna(row.get(col)):
                raw_val = str(row[col]).lower().strip()
                if raw_val and raw_val != "nan":
                    social_group = raw_val
                    break

        record = {
            "incomeLevel":         row["income_level"],
            "region":              row["location_type"],   # "location_type" becomes "region"
            "legalRepresentation": row["legal_representation"],
            "bailGranted":         int(row["bail_granted"]),
            "bailAmount":          int(row[bail_amount_col]) if bail_amount_col and pd.notna(row[bail_amount_col]) else None,
            "crimeType":           str(row["crime_type"]).lower().strip() if "crime_type" in df.columns else None,
            "severityCategory":    str(row["severity_category"]).lower().strip() if "severity_category" in df.columns else None,
            "socialGroup":         social_group,
        }
        clean_records.append(record)

    return clean_records