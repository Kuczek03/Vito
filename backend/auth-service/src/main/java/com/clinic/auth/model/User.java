package com.clinic.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 512)
    private String email;

    @Column(unique = true, nullable = false, length = 128)
    private String emailHash;

    @Column(length = 512)
    private String phone;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private int failedLoginAttempts;
    private int totalLockoutCount;
    private Instant lockedUntil;

    private Instant passwordChangedAt;
    private boolean passwordExpired;

    private boolean mfaEnabled;
    @Column(length = 512)
    private String mfaSecret;

    @Column(length = 64)
    private String lastKnownIp;
    private Instant lastLoginAt;

    @Column(length = 64)
    private String username;

    private boolean enabled;
    private Instant createdAt;
}
