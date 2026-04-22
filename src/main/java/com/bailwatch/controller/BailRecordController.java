package com.bailwatch.controller;

import com.bailwatch.model.BailRecord;
import com.bailwatch.repository.BailRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bail")
public class BailRecordController {

    @Autowired
    private BailRecordRepository repository;

    @PostMapping("/add")
    public BailRecord addRecord(@RequestBody BailRecord record) {
        return repository.save(record);
    }

    @GetMapping("/all")
    public List<BailRecord> getAll() {
        return repository.findAll();
    }
}