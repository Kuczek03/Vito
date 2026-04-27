package com.clinic.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Slf4j
@Service
public class PwnedPasswordService {

    private static final String API_URL = "https://api.pwnedpasswords.com/range/";

    public boolean isPasswordPwned(String password) {
        try {
            String sha1 = sha1Hex(password).toUpperCase();
            String prefix = sha1.substring(0, 5);
            String suffix = sha1.substring(5);

            String responseBody = callHibpApi(prefix);

            for (String line : responseBody.split("\n")) {
                String[] parts = line.split(":");
                if (parts.length >= 1 && parts[0].trim().equalsIgnoreCase(suffix)) {
                    long count = parts.length > 1 ? Long.parseLong(parts[1].trim()) : 1;
                    log.warn("Password found in HIBP database, occurrence count={}", count);
                    return true;
                }
            }
            return false;

        } catch (Exception e) {
            log.error("HIBP API unavailable, skipping pwned check: {}", e.getMessage());
            return false;
        }
    }

    private String callHibpApi(String prefix) throws Exception {
        URL url = new URL(API_URL + prefix);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("User-Agent", "Vito-Clinic-AuthService");
        connection.setConnectTimeout(3000);
        connection.setReadTimeout(3000);

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line).append("\n");
            return sb.toString();
        }
    }

    private String sha1Hex(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hashBytes);
    }
}
