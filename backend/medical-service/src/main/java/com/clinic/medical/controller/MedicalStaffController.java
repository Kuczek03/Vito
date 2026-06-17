package com.clinic.medical.controller;

import com.clinic.medical.dto.StaffRequest;
import com.clinic.medical.dto.StaffResponse;
import com.clinic.medical.service.MedicalStaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class MedicalStaffController {

    private final MedicalStaffService staffService;

    /** Wszyscy zalogowani mogą pobrać listę lekarzy (potrzebne przy umawianiu wizyty) */
    @GetMapping
    public ResponseEntity<List<StaffResponse>> getAll() {
        return ResponseEntity.ok(staffService.getAll());
    }

    /** Tylko ADMIN może dodać nowego pracownika */
    @PostMapping
    public ResponseEntity<StaffResponse> create(@Valid @RequestBody StaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffService.create(request));
    }
}
