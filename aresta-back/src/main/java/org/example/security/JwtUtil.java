package org.example.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.example.model.User;

import java.util.Date;
import java.util.Optional;

public class JwtUtil {
    private static final String SECRET = "ArestaSecretJwtKey2026_RobustAdminAuthSecurity_998877!";
    private static final long EXPIRATION_TIME = 86400000L; // 24 horas

    private static final Algorithm ALGORITHM = Algorithm.HMAC256(SECRET);

    public static String generateToken(User user) {
        return JWT.create()
                .withSubject(user.email())
                .withClaim("userId", user.id())
                .withClaim("name", user.name())
                .withClaim("role", user.role())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .sign(ALGORITHM);
    }

    public static Optional<DecodedJWT> verifyToken(String token) {
        try {
            DecodedJWT jwt = JWT.require(ALGORITHM)
                    .build()
                    .verify(token);
            return Optional.of(jwt);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
