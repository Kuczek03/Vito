package com.clinic.medical.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.Instant;

@Data
public class AppointmentRequest {

    @NotNull
    private Long patientId;

    @NotNull
    private Long doctorId;

    @NotNull
    @Future(message = "Data wizyty musi być w przyszłości.")
    private Instant appointmentDate;
}
