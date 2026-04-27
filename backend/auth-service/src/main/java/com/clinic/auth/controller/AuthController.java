package com.clinic.auth.controller;

import com.clinic.auth.dto.AuthResponse;
import com.clinic.auth.dto.LoginRequest;
import com.clinic.auth.dto.RegisterRequest;
import com.clinic.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(resolveClientIp(httpRequest), request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(resolveClientIp(httpRequest), request));
    }

    @PostMapping("/mfa/enable/{userId}")
    public ResponseEntity<Map<String, String>> enableMfa(@PathVariable Long userId) {
        String qrUri = authService.enableMfa(userId);
        return ResponseEntity.ok(Map.of("qrUri", qrUri));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
