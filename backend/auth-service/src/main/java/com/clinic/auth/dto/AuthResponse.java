package com.clinic.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String  token;

    private boolean unknownLocation;

    private String  mfaQrUri;
}
