package com.clinic.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @Size(min = 3, max = 64, message = "Nazwa użytkownika musi mieć od 3 do 64 znaków.")
    @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Nazwa użytkownika może zawierać tylko litery, cyfry, _, . i -")
    private String username;

    @NotBlank(message = "E-mail nie może być pusty.")
    @Email(message = "Nieprawidłowy format adresu e-mail.")
    @Size(max = 254, message = "E-mail jest za długi.")
    private String email;

    @Pattern(regexp = "^\\+?[0-9\\s\\-]{7,20}$", message = "Nieprawidłowy format numeru telefonu.")
    private String phone;

    @NotBlank(message = "Hasło nie może być puste.")
    @Size(min = 8, max = 128, message = "Hasło musi mieć od 8 do 128 znaków.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).+$",
        message = "Hasło musi zawierać co najmniej jedną wielką literę, małą literę, cyfrę i znak specjalny."
    )
    private String password;
}
