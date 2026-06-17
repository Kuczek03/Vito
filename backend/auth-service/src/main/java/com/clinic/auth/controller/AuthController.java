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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
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

    /**
     * Włączanie MFA — wymaga JWT (endpoint authenticated).
     * Użytkownik może włączyć MFA tylko dla własnego konta.
     * Admin może włączyć dla dowolnego konta.
     */
    @PostMapping("/mfa/enable/{userId}")
    public ResponseEntity<Map<String, String>> enableMfa(
            @PathVariable Long userId,
            Authentication authentication) {

        Long currentUserId = (Long) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !currentUserId.equals(userId)) {
            throw new AccessDeniedException(
                "Możesz włączyć MFA tylko dla własnego konta.");
        }

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
