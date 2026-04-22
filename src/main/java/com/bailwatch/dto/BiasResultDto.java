package com.bailwatch.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class BiasResultDto {

    @JsonProperty("datasetId")     private Long datasetId;
    @JsonProperty("country")       private String country;
    @JsonProperty("biasScores")    private Map<String, Double> biasScores;
    @JsonProperty("overallVerdict")private String overallVerdict;
    @JsonProperty("breakdown")     private List<Map<String, Object>> breakdown;
    @JsonProperty("explanation")   private String explanation;
    @JsonProperty("keyFindings")   private List<String> keyFindings;
    @JsonProperty("recommendations")private List<String> recommendations;
    @JsonProperty("severity")      private String severity;
    @JsonProperty("sdgRelevance")  private String sdgRelevance;
    @JsonProperty("engine")        private String engine;
    @JsonProperty("keySentence")   private String keySentence;

    public Long getDatasetId()                        { return datasetId; }
    public void setDatasetId(Long v)                  { this.datasetId = v; }
    public String getCountry()                        { return country; }
    public void setCountry(String v)                  { this.country = v; }
    public Map<String, Double> getBiasScores()        { return biasScores; }
    public void setBiasScores(Map<String, Double> v)  { this.biasScores = v; }
    public String getOverallVerdict()                 { return overallVerdict; }
    public void setOverallVerdict(String v)           { this.overallVerdict = v; }
    public List<Map<String,Object>> getBreakdown()    { return breakdown; }
    public void setBreakdown(List<Map<String,Object>> v){ this.breakdown = v; }
    public String getExplanation()                    { return explanation; }
    public void setExplanation(String v)              { this.explanation = v; }
    public List<String> getKeyFindings()              { return keyFindings; }
    public void setKeyFindings(List<String> v)        { this.keyFindings = v; }
    public List<String> getRecommendations()          { return recommendations; }
    public void setRecommendations(List<String> v)    { this.recommendations = v; }
    public String getSeverity()                       { return severity; }
    public void setSeverity(String v)                 { this.severity = v; }
    public String getSdgRelevance()                   { return sdgRelevance; }
    public void setSdgRelevance(String v)             { this.sdgRelevance = v; }
    public String getEngine()                         { return engine; }
    public void setEngine(String v)                   { this.engine = v; }
    public String getKeySentence()                    { return keySentence; }
    public void setKeySentence(String v)              { this.keySentence = v; }
}