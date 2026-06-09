package com.clinic.medical.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PatientRequest {

    // userId konta pacjenta – wymagany gdy tworzy admin/lekarz/pielęgniarka
    // gdy tworzy sam pacjent, zostanie użyte jego własne userId z tokenu
    private Long userId;

    @NotBlank
    @Size(max = 64)
    private String firstName;

    @NotBlank
    @Size(max = 64)
    private String lastName;

    @NotBlank
    @Pattern(regexp = "\\d{11}", message = "PESEL musi mieć dokładnie 11 cyfr.")
    private String pesel;

    @Pattern(regexp = "^\\+?[0-9\\s\\-]{7,20}$", message = "Nieprawidłowy numer telefonu.")
    private String phoneNumber;
}
