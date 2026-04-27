package com.clinic.auth.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class MfaService {

    private static final int    CODE_DIGITS    = 6;
    private static final int    TIME_STEP      = 30;
    private static final int    WINDOW         = 1;
    private static final String HMAC_ALGORITHM = "HmacSHA1";

    public String generateSecret() {
        byte[] secretBytes = new byte[20];
        new SecureRandom().nextBytes(secretBytes);
        return Base64.getEncoder().encodeToString(secretBytes);
    }

    public String generateQrUri(String email, String secret, String issuer) {
        String base32Secret = toBase32(Base64.getDecoder().decode(secret));
        return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=%d&period=%d",
                issuer, email, base32Secret, issuer, CODE_DIGITS, TIME_STEP);
    }

    public boolean verifyCode(String secret, String userCode) {
        if (userCode == null || userCode.length() != CODE_DIGITS) return false;

        int providedCode;
        try {
            providedCode = Integer.parseInt(userCode);
        } catch (NumberFormatException e) {
            return false;
        }

        long currentStep = Instant.now().getEpochSecond() / TIME_STEP;
        byte[] secretBytes = Base64.getDecoder().decode(secret);

        for (int i = -WINDOW; i <= WINDOW; i++) {
            if (generateCode(secretBytes, currentStep + i) == providedCode) {
                return true;
            }
        }
        return false;
    }

    private int generateCode(byte[] secret, long timeStep) {
        try {
            byte[] stepBytes = ByteBuffer.allocate(8).putLong(timeStep).array();

            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            byte[] hmac = mac.doFinal(stepBytes);

            int offset = hmac[hmac.length - 1] & 0x0F;
            int code = ((hmac[offset]     & 0x7F) << 24)
                     | ((hmac[offset + 1] & 0xFF) << 16)
                     | ((hmac[offset + 2] & 0xFF) << 8)
                     |  (hmac[offset + 3] & 0xFF);

            return code % (int) Math.pow(10, CODE_DIGITS);
        } catch (Exception e) {
            throw new RuntimeException("Błąd generowania kodu TOTP.", e);
        }
    }

    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private String toBase32(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0, bitsLeft = 0;
        for (byte b : bytes) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                bitsLeft -= 5;
                sb.append(BASE32_CHARS.charAt((buffer >> bitsLeft) & 0x1F));
            }
        }
        if (bitsLeft > 0) {
            sb.append(BASE32_CHARS.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        return sb.toString();
    }
}
