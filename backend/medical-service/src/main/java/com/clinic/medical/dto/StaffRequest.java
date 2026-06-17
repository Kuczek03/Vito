package com.clinic.medical.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StaffRequest {

    @NotNull
    private Long userId;

    @NotBlank
    @Size(max = 64)
    private String username;

    @NotBlank
    @Size(max = 64)
    private String firstName;

    @NotBlank
    @Size(max = 64)
    private String lastName;

    @Size(max = 128)
    private String specialization;

    @Size(max = 64)
    private String licenseNumber;
}
