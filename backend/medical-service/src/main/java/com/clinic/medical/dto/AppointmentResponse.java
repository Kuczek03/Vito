package com.clinic.medical.dto;

import com.clinic.medical.model.AppointmentStatus;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data @Builder
public class AppointmentResponse {
    private Long              id;
    private Long              patientId;
    private String            patientName;
    private Long              doctorId;
    private String            doctorName;
    private Instant           appointmentDate;
    private AppointmentStatus status;
}
