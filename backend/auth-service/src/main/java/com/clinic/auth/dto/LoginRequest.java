package com.clinic.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "E-mail nie może być pusty.")
    @Email(message = "Nieprawidłowy format adresu e-mail.")
    @Size(max = 254, message = "E-mail jest za długi.")
    private String email;

    @NotBlank(message = "Hasło nie może być puste.")
    @Size(min = 1, max = 128, message = "Hasło jest za długie.")
    private String password;

    @Size(min = 6, max = 6, message = "Kod MFA musi mieć dokładnie 6 cyfr.")
    private String mfaCode;
}
