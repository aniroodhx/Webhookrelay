package com.anirudh.webhookrelay.security;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Component
public class HmacSigner {

    private static final String ALGORITHM = "HmacSHA256";

    public String sign(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            mac.init(keySpec);
            byte[] signatureBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(signatureBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign webhook payload", e);
        }
    }

    /** Constant-time comparison to avoid timing attacks when verifying signatures. */
    public boolean verify(String payload, String secret, String providedSignature) {
        String expected = sign(payload, secret);
        return java.security.MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                providedSignature.getBytes(StandardCharsets.UTF_8)
        );
    }
}
