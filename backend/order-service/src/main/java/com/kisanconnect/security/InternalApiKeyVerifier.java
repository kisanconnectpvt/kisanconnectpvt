package com.kisanconnect.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InternalApiKeyVerifier {
    private final String configuredKey;

    public InternalApiKeyVerifier(@Value("${internal.api-key:}") String configuredKey) {
        this.configuredKey = configuredKey;
    }

    public boolean isValid(String suppliedKey) {
        if (configuredKey == null || configuredKey.isBlank() || suppliedKey == null) {
            return false;
        }
        return MessageDigest.isEqual(
                configuredKey.getBytes(StandardCharsets.UTF_8),
                suppliedKey.getBytes(StandardCharsets.UTF_8));
    }
}