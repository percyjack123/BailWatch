package com.bailwatch.service;

import com.bailwatch.dto.BiasResultDto;
import com.bailwatch.model.BailRecord;
import com.bailwatch.repository.BailRecordRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class BiasAuditService {

    private final BailRecordRepository repository;
    private final RestTemplate restTemplate;

    @Value("${flask.analyze.url:http://localhost:5000/analyze}")
    private String flaskUrl;

    public BiasAuditService(BailRecordRepository repository, RestTemplate restTemplate) {
        this.repository = repository;
        this.restTemplate = restTemplate;
    }

    public BiasResultDto runAudit(Long datasetId) {

        if (datasetId == null) {
            throw new IllegalArgumentException("datasetId must not be null.");
        }

        List<BailRecord> records = repository.findByDatasetId(datasetId);

        if (records == null || records.isEmpty()) {
            throw new IllegalArgumentException("No records found for datasetId: " + datasetId);
        }

        // ── FIX B2: Convert JPA entities to plain Maps that Flask can read ────
        // BailRecord has fields: incomeLevel, region, legalRepresentation, bailGranted
        // Flask bias_engine.py expects: incomeLevel, region, legalRepresentation, bailGranted
        // We also inject datasetId into each record so Flask can use it for caching.
        List<Map<String, Object>> plainRecords = new ArrayList<>();
        for (BailRecord r : records) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("incomeLevel",         r.getIncomeLevel());
            m.put("region",              r.getRegion());
            m.put("legalRepresentation", r.getLegalRepresentation());
            m.put("bailGranted",         r.getBailGranted());
            m.put("datasetId",           datasetId);   // Flask uses this for explanation caching
            if (r.getSocialGroup() != null && !r.getSocialGroup().isBlank()) {
                m.put("socialGroup", r.getSocialGroup());
            }
            plainRecords.add(m);
        }

        // ── FIX B3: Infer country from dataset so Flask builds a meaningful narrative ──
        // The CSV column "country" is not stored in BailRecord (it's not in the entity).
        // We derive it from incomeLevel currency hint stored in the CSV column names,
        // but since we don't store raw country we fall back to a safe UNKNOWN.
        // The REAL fix is to store country in BailRecord — see stability note below.
        // For now we send UNKNOWN which is at least honest and won't crash.
        String country = inferCountry(records);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("records", plainRecords);
        payload.put("country", country);

        try {
            ResponseEntity<Map> rawResponse = restTemplate.postForEntity(flaskUrl, payload, Map.class);

            if (rawResponse == null || rawResponse.getBody() == null) {
                throw new RuntimeException("Bias engine returned an empty response. Check Flask logs.");
            }

            Map<String, Object> body = rawResponse.getBody();

            if (body.containsKey("error")) {
                throw new RuntimeException("Bias engine reported an error: " + body.get("error"));
            }

            BiasResultDto result = mapToDto(body);

            if (result.getExplanation() == null || result.getExplanation().isBlank()) {
                result.setExplanation("Explanation was not provided by the bias engine.");
            }

            return result;

        } catch (RestClientException e) {
            throw new RuntimeException(
                    "Bias engine is unavailable at " + flaskUrl + ". Is Flask running? Error: " + e.getMessage()
            );
        }
    }

    /**
     * Infers jurisdiction from stored bail records.
     * BailRecord currently doesn't store country — this is a best-effort heuristic.
     * The proper fix is to add a 'country' column to BailRecord and populate it in
     * CsvIngestionService (see stability note in audit).
     */
    private String inferCountry(List<BailRecord> records) {
        if (records == null || records.isEmpty()) return "UNKNOWN";
        String c = records.get(0).getCountry();
        return (c != null && !c.isBlank()) ? c.toUpperCase() : "UNKNOWN";
    }

    /**
     * Maps Flask's full JSON response to BiasResultDto.
     * All fields Flask returns are now captured — none are silently dropped.
     */
    @SuppressWarnings("unchecked")
    private BiasResultDto mapToDto(Map<String, Object> body) {
        BiasResultDto dto = new BiasResultDto();

        // datasetId
        Object rawId = body.get("datasetId");
        if (rawId instanceof Number) dto.setDatasetId(((Number) rawId).longValue());

        // country
        Object rawCountry = body.get("country");
        if (rawCountry instanceof String) dto.setCountry((String) rawCountry);

        // biasScores
        Object rawScores = body.get("biasScores");
        if (rawScores instanceof Map) {
            Map<String, Object> scoresRaw = (Map<String, Object>) rawScores;
            Map<String, Double> scores = new LinkedHashMap<>();
            scoresRaw.forEach((k, v) -> { if (v instanceof Number) scores.put(k, ((Number)v).doubleValue()); });
            dto.setBiasScores(scores);
        }

        // overallVerdict
        Object rawVerdict = body.get("overallVerdict");
        if (rawVerdict instanceof String) dto.setOverallVerdict((String) rawVerdict);

        // breakdown
        Object rawBreakdown = body.get("breakdown");
        if (rawBreakdown instanceof List) dto.setBreakdown((List<Map<String, Object>>) rawBreakdown);

        // explanation — never null
        Object rawExp = body.get("explanation");
        if (rawExp instanceof String && !((String) rawExp).isBlank()) {
            dto.setExplanation((String) rawExp);
        } else {
            dto.setExplanation("No explanation was generated.");
        }

        // keyFindings
        Object rawFindings = body.get("keyFindings");
        if (rawFindings instanceof List) dto.setKeyFindings((List<String>) rawFindings);

        // recommendations
        Object rawRecs = body.get("recommendations");
        if (rawRecs instanceof List) dto.setRecommendations((List<String>) rawRecs);

        // severity
        Object rawSev = body.get("severity");
        if (rawSev instanceof String) dto.setSeverity((String) rawSev);

        // sdgRelevance
        Object rawSdg = body.get("sdgRelevance");
        if (rawSdg instanceof String) dto.setSdgRelevance((String) rawSdg);

        // engine
        Object rawEngine = body.get("engine");
        if (rawEngine instanceof String) dto.setEngine((String) rawEngine);

        // keySentence
        Object rawKey = body.get("keySentence");
        if (rawKey instanceof String) dto.setKeySentence((String) rawKey);

        return dto;
    }
}