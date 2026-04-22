package com.bailwatch.model;

import jakarta.persistence.*;

@Entity
public class BailRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String incomeLevel;
    private String region;
    private String legalRepresentation;
    private int bailGranted;

    private Long datasetId;
    // Add inside the class, with the other fields:
    private String country;
    private String socialGroup;

    // Getters and Setters
    public Long getId() { return id; }

    public String getIncomeLevel() { return incomeLevel; }
    public void setIncomeLevel(String incomeLevel) { this.incomeLevel = incomeLevel; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getLegalRepresentation() { return legalRepresentation; }
    public void setLegalRepresentation(String legalRepresentation) { this.legalRepresentation = legalRepresentation; }

    public int getBailGranted() { return bailGranted; }
    public void setBailGranted(int bailGranted) { this.bailGranted = bailGranted; }

    public Long getDatasetId() { return datasetId; }
    public void setDatasetId(Long datasetId) { this.datasetId = datasetId; }

    // Add getter/setter:
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getSocialGroup() { return socialGroup; }
    public void setSocialGroup(String socialGroup) { this.socialGroup = socialGroup; }
}