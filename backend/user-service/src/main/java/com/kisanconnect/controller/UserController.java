package com.kisanconnect.controller;

import com.kisanconnect.dto.UserDto.*;
import com.kisanconnect.entity.User;
import com.kisanconnect.security.InternalApiKeyVerifier;
import com.kisanconnect.security.JwtUtil;
import com.kisanconnect.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Farmer & Buyer registration, login, and profile APIs")
public class UserController {
    private final UserService service;
    private final JwtUtil jwtUtil;
    private final InternalApiKeyVerifier internalApiKeyVerifier;

    @PostMapping("/register")
    @Operation(summary = "Register a new farmer or buyer")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.register(req));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(service.login(req));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user profile by ID", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<UserResponse> getById(@PathVariable UUID id,
            @RequestHeader("Authorization") String authorization) {
        UUID authenticatedUserId = UUID.fromString(jwtUtil.getUserId(authorization.substring(7)));
        if (!id.equals(authenticatedUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot access another user's profile");
        }
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}/address")
    @Operation(summary = "Update your delivery or farm address", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<UserResponse> updateAddress(@PathVariable UUID id,
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody AddressUpdateRequest request) {
        UUID authenticatedUserId = UUID.fromString(jwtUtil.getUserId(authorization.substring(7)));
        if (!id.equals(authenticatedUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot update another user's address");
        }
        return ResponseEntity.ok(service.updateAddress(id, request));
    }

    @GetMapping("/internal/{id}")
    @Operation(summary = "Internal lookup of user by ID")
    public ResponseEntity<UserResponse> getInternalById(@PathVariable UUID id,
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String internalApiKey) {
        if (!internalApiKeyVerifier.isValid(internalApiKey)) {
            throw new org.springframework.security.access.AccessDeniedException("Internal service authentication required");
        }
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    @Operation(summary = "List users — optionally filtered by role", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<List<UserResponse>> list(@RequestParam(required = false) String role,
            @RequestHeader("Authorization") String authorization) {
        if (!User.Role.ADMIN.name().equals(jwtUtil.getRole(authorization.substring(7)))) {
            throw new org.springframework.security.access.AccessDeniedException("Administrator access required");
        }
        return ResponseEntity.ok(service.getAllByRole(role));
    }
}
