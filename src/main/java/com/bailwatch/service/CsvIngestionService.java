package com.bailwatch.service;

import com.bailwatch.model.BailRecord;
import com.bailwatch.repository.BailRecordRepository;
import com.opencsv.CSVReader;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CsvIngestionService {

    private final BailRecordRepository repository;

    public CsvIngestionService(BailRecordRepository repository) {
        this.repository = repository;
    }

    public Long ingestCsv(MultipartFile file) throws Exception {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty or missing.");
        }

        Long datasetId = System.currentTimeMillis();
        List<BailRecord> records = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {

            String[] headers = reader.readNext();
            if (headers == null || headers.length == 0) {
                throw new IllegalArgumentException("CSV file has no headers.");
            }

            // Build header name → column index map (lowercase, trimmed)
            Map<String, Integer> colIndex = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                colIndex.put(headers[i].trim().toLowerCase(), i);
            }

            String[] line;
            while ((line = reader.readNext()) != null) {
                BailRecord r = new BailRecord();
                try {
                    // Income level — present in all 3 CSVs
                    r.setIncomeLevel(
                            normalize(getCol(line, colIndex, "income_level", "unknown"))
                    );

                    // Legal representation — normalize to "yes" / "no"
                    String legalRep = getCol(line, colIndex, "legal_representation", "no");
                    r.setLegalRepresentation(normalizeLegalRep(legalRep));

                    // Region — must be location_type (rural/urban/semi-urban)
                    // The bias engine groups by these values, NOT by state/region name.
                    // All 3 CSVs (India, UK, USA) have a "location_type" column.
                    String region = getCol(line, colIndex, "location_type", null);
                    if (region == null || region.isBlank()) {
                        // Fallback chain: if location_type is absent, use geographic columns
                        region = getCol(line, colIndex, "state", null);
                        if (region == null) region = getCol(line, colIndex, "country_region", null);
                        if (region == null) region = "unknown";
                    }
                    r.setRegion(normalize(region));

                    // socialGroup — prefer religion (India), then ethnicity (UK), then race_ethnicity (USA)
                    String socialGroup = getCol(line, colIndex, "religion", null);
                    if (socialGroup == null || socialGroup.isBlank()) {
                        socialGroup = getCol(line, colIndex, "ethnicity", null);
                    }
                    if (socialGroup == null || socialGroup.isBlank()) {
                        socialGroup = getCol(line, colIndex, "race_ethnicity", null);
                    }
                    if (socialGroup == null || socialGroup.isBlank()) {
                        socialGroup = getCol(line, colIndex, "race", null);
                    }
                    r.setSocialGroup(socialGroup != null ? normalize(socialGroup) : null);

                    // bail_granted — present in all 3 CSVs
                    String bailValue = getCol(line, colIndex, "bail_granted", "0");
                    r.setBailGranted("1".equals(bailValue.trim()) ? 1 : 0);

                    // Country — read directly from the CSV "country" column.
                    // All 3 CSVs have this column (values: "India", "UK", "USA").
                    // Stored uppercase so BiasAuditService can send it straight to Flask.
                    String country = getCol(line, colIndex, "country", "UNKNOWN");
                    r.setCountry(country.toUpperCase().trim());

                    r.setDatasetId(datasetId);
                    records.add(r);

                } catch (Exception e) {
                    System.out.println("Skipping bad row: " + Arrays.toString(line) + " | Reason: " + e.getMessage());
                }
            }
        }

        if (records.isEmpty()) {
            throw new IllegalArgumentException("No valid records could be parsed from the CSV.");
        }

        repository.saveAll(records);
        return datasetId;
    }

    // Safely fetch a column value by header name; returns defaultVal if column missing or blank
    private String getCol(String[] line, Map<String, Integer> colIndex, String name, String defaultVal) {
        Integer idx = colIndex.get(name.toLowerCase());
        if (idx == null || idx >= line.length) return defaultVal;
        String val = line[idx].trim();
        return val.isEmpty() ? defaultVal : val;
    }

    // Lowercase + trim
    private String normalize(String val) {
        return val == null ? "unknown" : val.toLowerCase().trim();
    }

    // Normalize legal representation to "yes" or "no"
    private String normalizeLegalRep(String val) {
        if (val == null) return "no";
        String v = val.toLowerCase().trim();
        return (v.equals("yes") || v.equals("y") || v.equals("true") || v.equals("1")) ? "yes" : "no";
    }
}