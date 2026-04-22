package com.bailwatch.controller;

import com.bailwatch.dto.BiasResultDto;
import com.bailwatch.repository.BailRecordRepository;
import com.bailwatch.service.BiasAuditService;
import com.bailwatch.service.CsvIngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final CsvIngestionService  csvService;
    private final BiasAuditService     auditService;
    private final BailRecordRepository repository;

    public AuditController(CsvIngestionService csvService,
                           BiasAuditService auditService,
                           BailRecordRepository repository) {
        this.csvService   = csvService;
        this.auditService = auditService;
        this.repository   = repository;
    }

    @PostMapping("/upload")
    public ResponseEntity<Long> upload(@RequestParam("file") MultipartFile file) throws Exception {
        Long datasetId = csvService.ingestCsv(file);
        return ResponseEntity.ok(datasetId);
    }

    @GetMapping("/run/{datasetId}")
    public ResponseEntity<BiasResultDto> runAudit(@PathVariable Long datasetId) {
        BiasResultDto result = auditService.runAudit(datasetId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalRecords   = repository.count();
        long totalDatasets  = repository.countDistinctDatasets();
        long totalCountries = repository.countDistinctCountries();

        Map<String, Long> byCountry = new LinkedHashMap<>();
        for (Object[] row : repository.countByCountry()) {
            String c = row[0] != null ? row[0].toString() : "UNKNOWN";
            byCountry.put(c, ((Number) row[1]).longValue());
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRecords",   totalRecords);
        stats.put("totalDatasets",  totalDatasets);
        stats.put("totalCountries", totalCountries);
        stats.put("biasDimensions", 4);
        stats.put("byCountry",      byCountry);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory() {
        List<Map<String, Object>> history = new ArrayList<>();

        for (Object[] row : repository.findDatasetSummaries()) {
            Long   datasetId   = ((Number) row[0]).longValue();
            String country     = row[1] != null ? row[1].toString() : "UNKNOWN";
            long   recordCount = ((Number) row[2]).longValue();

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("datasetId",   datasetId);
            entry.put("country",     country);
            entry.put("recordCount", recordCount);
            history.add(entry);
        }

        return ResponseEntity.ok(history);
    }
}