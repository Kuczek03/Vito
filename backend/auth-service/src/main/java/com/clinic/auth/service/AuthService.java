package com.clinic.auth.service;

import com.clinic.auth.dto.AuthResponse;
import com.clinic.auth.dto.LoginRequest;
import com.clinic.auth.dto.RegisterRequest;
import com.clinic.auth.exception.AccountLockedException;
import com.clinic.auth.exception.EmailAlreadyExistsException;
import com.clinic.auth.exception.MfaRequiredException;
import com.clinic.auth.exception.PasswordExpiredException;
import com.clinic.auth.exception.PwnedPasswordException;
import com.clinic.auth.model.Role;
import com.clinic.auth.model.User;
import com.clinic.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    @Value("${security.password-expiry-days:90}")
    private int passwordExpiryDays;

    private static final int   MAX_ATTEMPTS         = 5;
    private static final int[] LOCKOUT_MINUTES_TABLE = {1, 5, 15, 30, 60, 120};

    @Value("${security.mfa-issuer:Vito Clinic}")
    private String mfaIssuer;

    private final UserRepository      userRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtService          jwtService;
    private final EncryptionService   encryptionService;
    private final PwnedPasswordService pwnedPasswordService;
    private final MfaService          mfaService;
    private final GeoIpService        geoIpService;

    @Transactional
    public AuthResponse register(String clientIp, RegisterRequest request) {

        String emailHash = encryptionService.hash(request.getEmail());
        if (userRepository.existsByEmailHash(emailHash)) {
            log.warn("Registration attempt for already-existing email, ip={}", clientIp);
            throw new EmailAlreadyExistsException("Konto z tym adresem e-mail już istnieje.");
        }

        if (request.getUsername() != null && userRepository.existsByUsername(request.getUsername())) {
            throw new EmailAlreadyExistsException("Ta nazwa użytkownika jest już zajęta.");
        }

        if (pwnedPasswordService.isPasswordPwned(request.getPassword())) {
            throw new PwnedPasswordException(
                "To hasło figuruje w bazach skradzionych danych. Wybierz inne hasło.");
        }

        User user = User.builder()
                .email(encryptionService.encrypt(request.getEmail().toLowerCase()))
                .emailHash(emailHash)
                .phone(request.getPhone() != null ? encryptionService.encrypt(request.getPhone()) : null)
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PATIENT)
                .enabled(true)
                .passwordChangedAt(Instant.now())
                .passwordExpired(false)
                .mfaEnabled(false)
                .failedLoginAttempts(0)
                .totalLockoutCount(0)
                .createdAt(Instant.now())
                .lastKnownIp(clientIp)
                .build();

        userRepository.save(user);
        log.info("New user registered id={} ip={}", user.getId(), clientIp);

        return new AuthResponse(jwtService.generateToken(user), false, null);
    }

    @Transactional
    public AuthResponse login(String clientIp, LoginRequest request) {

        String emailHash = encryptionService.hash(request.getEmail());
        User user = userRepository.findByEmailHash(emailHash).orElse(null);

        if (user == null) {
            passwordEncoder.matches(request.getPassword(),
                "$2a$12$dummyHashToPreventTimingAttack000000000000000000000000");
            log.warn("Login attempt for non-existent email, ip={}", clientIp);
            throw new BadCredentialsException("Nieprawidłowy e-mail lub hasło.");
        }

        checkAccountLocked(user);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            handleFailedAttempt(user, clientIp);
            throw new BadCredentialsException("Nieprawidłowy e-mail lub hasło.");
        }

        if (isPasswordExpired(user)) {
            log.warn("Expired password for user id={}", user.getId());
            throw new PasswordExpiredException(
                "Twoje hasło wygasło. Zmień hasło, aby kontynuować.");
        }

        boolean isUnknownLocation = geoIpService.isUnknownLocation(user, clientIp);
        if (isUnknownLocation) {
            log.warn("Login from unknown location for user id={}, ip={}", user.getId(), clientIp);
        }

        if (user.isMfaEnabled()) {
            if (request.getMfaCode() == null || request.getMfaCode().isBlank()) {
                throw new MfaRequiredException("Wymagany kod MFA.");
            }
            if (!mfaService.verifyCode(
                    encryptionService.decrypt(user.getMfaSecret()),
                    request.getMfaCode())) {
                handleFailedAttempt(user, clientIp);
                throw new BadCredentialsException("Nieprawidłowy kod MFA.");
            }
        }

        resetFailedAttempts(user, clientIp);
        log.info("Successful login user id={} ip={} unknownLocation={}", user.getId(), clientIp, isUnknownLocation);

        return new AuthResponse(jwtService.generateToken(user), isUnknownLocation, null);
    }

    @Transactional
    public String enableMfa(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Użytkownik nie istnieje."));

        String secret = mfaService.generateSecret();
        user.setMfaSecret(encryptionService.encrypt(secret));
        user.setMfaEnabled(true);
        userRepository.save(user);

        String email = encryptionService.decrypt(user.getEmail());
        return mfaService.generateQrUri(email, secret, mfaIssuer);
    }

    private void checkAccountLocked(User user) {
        if (user.getLockedUntil() != null && Instant.now().isBefore(user.getLockedUntil())) {
            long secondsLeft = Instant.now().until(user.getLockedUntil(), ChronoUnit.SECONDS);
            throw new AccountLockedException(
                "Konto tymczasowo zablokowane. Spróbuj ponownie za " + secondsLeft + " sekund.");
        }
    }

    private void handleFailedAttempt(User user, String clientIp) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= MAX_ATTEMPTS) {
            int lockoutIndex = Math.min(user.getTotalLockoutCount(), LOCKOUT_MINUTES_TABLE.length - 1);
            int lockoutMinutes = LOCKOUT_MINUTES_TABLE[lockoutIndex];

            user.setLockedUntil(Instant.now().plus(lockoutMinutes, ChronoUnit.MINUTES));
            user.setTotalLockoutCount(user.getTotalLockoutCount() + 1);
            user.setFailedLoginAttempts(0);

            log.warn("Account locked for user id={} ip={} lockout={}min lockoutCount={}",
                user.getId(), clientIp, lockoutMinutes, user.getTotalLockoutCount());
        }

        userRepository.save(user);
    }

    private void resetFailedAttempts(User user, String clientIp) {
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        user.setLastKnownIp(clientIp);
        userRepository.save(user);
    }

    private boolean isPasswordExpired(User user) {
        if (user.isPasswordExpired()) return true;
        if (user.getPasswordChangedAt() == null) return false;
        return user.getPasswordChangedAt()
                   .plus(passwordExpiryDays, ChronoUnit.DAYS)
                   .isBefore(Instant.now());
    }
}
