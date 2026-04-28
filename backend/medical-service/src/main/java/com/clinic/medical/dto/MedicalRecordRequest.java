package com.clinic.medical.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MedicalRecordRequest {

    @NotBlank(message = "Diagnoza jest wymagana.")
    @Size(max = 10000)
    private String diagnosis;

    @Size(max = 5000)
    private String prescription;
}
