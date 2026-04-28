package com.clinic.medical.controller;

import com.clinic.medical.dto.MedicalRecordRequest;
import com.clinic.medical.dto.MedicalRecordResponse;
import com.clinic.medical.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments/{appointmentId}/records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    public ResponseEntity<MedicalRecordResponse> create(
            @PathVariable Long appointmentId,
            @Valid @RequestBody MedicalRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(medicalRecordService.create(appointmentId, request));
    }

    @GetMapping
    public ResponseEntity<MedicalRecordResponse> get(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(medicalRecordService.getByAppointmentId(appointmentId));
    }
}
