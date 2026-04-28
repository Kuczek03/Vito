package com.clinic.medical.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data @Builder
public class MedicalRecordResponse {
    private Long    id;
    private Long    appointmentId;
    private String  diagnosis;
    private String  prescription;
    private Instant createdAt;
}
