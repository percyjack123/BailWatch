package com.bailwatch.repository;

import com.bailwatch.model.BailRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface BailRecordRepository extends JpaRepository<BailRecord, Long> {
    List<BailRecord> findByDatasetId(Long datasetId);

    long count();

    @Query("SELECT COUNT(DISTINCT r.datasetId) FROM BailRecord r")
    long countDistinctDatasets();

    @Query("SELECT COUNT(DISTINCT r.country) FROM BailRecord r WHERE r.country IS NOT NULL AND r.country <> 'UNKNOWN'")
    long countDistinctCountries();

    @Query("SELECT r.country, COUNT(r) FROM BailRecord r WHERE r.country IS NOT NULL GROUP BY r.country ORDER BY r.country")
    List<Object[]> countByCountry();

    @Query("SELECT r.datasetId, COALESCE(r.country, 'UNKNOWN'), COUNT(r) FROM BailRecord r GROUP BY r.datasetId, r.country ORDER BY r.datasetId DESC")
List<Object[]> findDatasetSummaries();
}