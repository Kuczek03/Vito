package com.clinic.medical.controller;

import com.clinic.medical.dto.AppointmentRequest;
import com.clinic.medical.dto.AppointmentResponse;
import com.clinic.medical.dto.NurseNotesRequest;
import com.clinic.medical.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments() {
        return ResponseEntity.ok(appointmentService.getForCurrentUser());
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.cancel(id));
    }

    @PatchMapping("/{id}/nurse-notes")
    public ResponseEntity<AppointmentResponse> addNurseNotes(
            @PathVariable Long id,
            @Valid @RequestBody NurseNotesRequest request) {
        return ResponseEntity.ok(appointmentService.addNurseNotes(id, request));
    }
}
