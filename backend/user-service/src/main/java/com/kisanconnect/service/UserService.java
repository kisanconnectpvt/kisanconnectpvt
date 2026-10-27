package com.kisanconnect.service;

import com.kisanconnect.dto.UserDto.*;
import com.kisanconnect.entity.User;
import com.kisanconnect.kafka.UserEventProducer;
import com.kisanconnect.repository.UserRepository;
import com.kisanconnect.security.JwtUtil;
import com.kisanconnect.exception.AuthenticationException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class UserService {
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final UserEventProducer eventProducer;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.getRole() == User.Role.ADMIN) {
            throw new IllegalArgumentException("Administrator accounts cannot be self-registered");
        }
        if (repo.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already registered: " + req.getEmail());
        User user = User.builder()
            .name(req.getName()).email(req.getEmail()).phone(blankToNull(req.getPhone()))
            .addressLine1(blankToNull(req.getAddressLine1())).addressLine2(blankToNull(req.getAddressLine2()))
            .city(blankToNull(req.getCity())).state(blankToNull(req.getState()))
            .postalCode(blankToNull(req.getPostalCode()))
            .password(encoder.encode(req.getPassword())).role(req.getRole()).status("ACTIVE").build();
        user = repo.save(user);
        eventProducer.publishUserRegistered(user);
        return buildAuth(user);
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    public AuthResponse login(LoginRequest req) {
        User user = repo.findByEmail(req.getEmail())
            .orElseThrow(() -> new AuthenticationException("Invalid credentials"));
        if (!encoder.matches(req.getPassword(), user.getPassword()))
            throw new AuthenticationException("Invalid credentials");
        return buildAuth(user);
    }

    public UserResponse getById(UUID id) {
        return toResponse(repo.findById(id).orElseThrow(() -> new RuntimeException("User not found")));
    }

    public List<UserResponse> getAllByRole(String role) {
        return repo.findAll().stream()
            .filter(u -> role == null || u.getRole().name().equalsIgnoreCase(role))
            .map(this::toResponse).collect(Collectors.toList());
    }

    private AuthResponse buildAuth(User u) {
        return AuthResponse.builder()
            .token(jwtUtil.generateToken(u.getEmail(), u.getRole().name(), u.getId().toString()))
            .tokenType("Bearer").userId(u.getId())
            .name(u.getName()).email(u.getEmail()).phone(u.getPhone())
            .addressLine1(u.getAddressLine1()).addressLine2(u.getAddressLine2())
            .city(u.getCity()).state(u.getState()).postalCode(u.getPostalCode())
            .role(u.getRole()).build();
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
            .id(u.getId()).name(u.getName()).email(u.getEmail()).phone(u.getPhone())
            .addressLine1(u.getAddressLine1()).addressLine2(u.getAddressLine2())
            .city(u.getCity()).state(u.getState()).postalCode(u.getPostalCode())
            .role(u.getRole()).status(u.getStatus()).createdAt(u.getCreatedAt()).build();
    }
}
