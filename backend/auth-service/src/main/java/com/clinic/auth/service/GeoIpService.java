package com.clinic.auth.service;

import com.clinic.auth.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class GeoIpService {

    public boolean isUnknownLocation(User user, String currentIp) {
        String lastIp = user.getLastKnownIp();

        if (lastIp == null || lastIp.isBlank()) {
            return false;
        }

        boolean different = !lastIp.equals(currentIp);
        if (different) {
            log.info("Location change detected for user id={}: {} -> {}",
                user.getId(), maskIp(lastIp), maskIp(currentIp));
        }
        return different;
    }

    private String maskIp(String ip) {
        if (ip == null) return "null";
        int lastDot = ip.lastIndexOf('.');
        return lastDot >= 0 ? ip.substring(0, lastDot) + ".***" : "***";
    }
}
