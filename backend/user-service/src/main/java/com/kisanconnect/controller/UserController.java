package com.kisanconnect.controller;

import com.kisanconnect.dto.UserDto.*;
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
    public ResponseEntity<UserResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    @Operation(summary = "List users — optionally filtered by role", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<List<UserResponse>> list(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(service.getAllByRole(role));
    }
}
