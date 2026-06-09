package com.clinic.medical.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class JwtConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public JwtDecoder jwtDecoder() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);

        // Dopasuj algorytm identycznie jak jjwt w auth-service
        MacAlgorithm macAlgorithm;
        String jcaAlgorithm;
        if (keyBytes.length >= 64) {
            macAlgorithm = MacAlgorithm.HS512;
            jcaAlgorithm = "HmacSHA512";
        } else if (keyBytes.length >= 48) {
            macAlgorithm = MacAlgorithm.HS384;
            jcaAlgorithm = "HmacSHA384";
        } else {
            macAlgorithm = MacAlgorithm.HS256;
            jcaAlgorithm = "HmacSHA256";
        }

        SecretKey key = new SecretKeySpec(keyBytes, jcaAlgorithm);
        return NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(macAlgorithm)  // <-- TO BYŁO BRAKUJĄCE
                .build();
    }
}