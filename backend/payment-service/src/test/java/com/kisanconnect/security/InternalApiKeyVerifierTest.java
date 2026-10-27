package com.kisanconnect.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class InternalApiKeyVerifierTest {
    @Test
    void acceptsOnlyConfiguredNonEmptyKey() {
        assertTrue(new InternalApiKeyVerifier("internal-test-key").isValid("internal-test-key"));
        assertFalse(new InternalApiKeyVerifier("internal-test-key").isValid("wrong-key"));
        assertFalse(new InternalApiKeyVerifier("").isValid("internal-test-key"));
        assertFalse(new InternalApiKeyVerifier("internal-test-key").isValid(null));
    }
}