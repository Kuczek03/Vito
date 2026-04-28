package com.clinic.medical.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long)) {
            throw new IllegalStateException("Brak zalogowanego użytkownika.");
        }
        return (Long) auth.getPrincipal();
    }

    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_" + role));
    }

    public static boolean isAdmin()   { return hasRole("ADMIN"); }
    public static boolean isDoctor()  { return hasRole("DOCTOR"); }
    public static boolean isNurse()   { return hasRole("NURSE"); }
    public static boolean isPatient() { return hasRole("PATIENT"); }
}
