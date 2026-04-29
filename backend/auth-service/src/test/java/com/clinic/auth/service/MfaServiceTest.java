package com.clinic.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MfaServiceTest {

    private MfaService mfaService;

    @BeforeEach
    void setUp() {
        mfaService = new MfaService();
    }

    @Test
    void shouldGenerateValidSecret() {
        String secret = mfaService.generateSecret();

        assertNotNull(secret);
        assertTrue(secret.length() > 10, "Wygenerowany sekret nie powinien być pusty");
    }

    @Test
    void shouldRejectInvalidFormatCode() {
        String secret = mfaService.generateSecret();

        assertFalse(mfaService.verifyCode(secret, null), "Powinien odrzucić null");
        assertFalse(mfaService.verifyCode(secret, "123"), "Powinien odrzucić za krótki kod");
        assertFalse(mfaService.verifyCode(secret, "ABCDEF"), "Powinien odrzucić kod z literami");
    }

}