package com.clinic.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class EncryptionService {

    private static final String ALGORITHM    = "AES/GCM/NoPadding";
    private static final int    IV_LENGTH    = 12;
    private static final int    TAG_LENGTH   = 128;

    @Value("${security.hash-algorithm:SHA-512}")
    private String hashAlgorithm;

    private final SecretKey aesKey;

    public EncryptionService(@Value("${security.encryption-key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        if (keyBytes.length != 32) {
            throw new IllegalArgumentException(
                "Klucz szyfrowania musi mieć dokładnie 256 bitów (32 bajty zakodowane w Base64).");
        }
        this.aesKey = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Błąd szyfrowania danych osobowych.", e);
        }
    }

    public String decrypt(String base64Ciphertext) {
        if (base64Ciphertext == null) return null;
        try {
            byte[] combined = Base64.getDecoder().decode(base64Ciphertext);
            byte[] iv         = new byte[IV_LENGTH];
            byte[] ciphertext = new byte[combined.length - IV_LENGTH];

            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            System.arraycopy(combined, IV_LENGTH, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(TAG_LENGTH, iv));

            return new String(cipher.doFinal(ciphertext));
        } catch (Exception e) {
            throw new RuntimeException("Błąd deszyfrowania danych osobowych.", e);
        }
    }

    public String hash(String value) {
        if (value == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance(hashAlgorithm);
            byte[] hashBytes = digest.digest(value.toLowerCase().getBytes());
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException("Błąd hashowania wartości.", e);
        }
    }
}
