package com.kisanconnect.dto;

import com.kisanconnect.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

public class UserDto {

    @Data public static class RegisterRequest {
        @NotBlank @Size(min=2,max=120) private String name;
        @NotBlank @Email private String email;
        @Pattern(regexp="(^$|^[6-9]\\d{9}$)", message="Enter a valid 10-digit mobile number")
        private String phone;
        @Size(max=150) private String addressLine1;
        @Size(max=150) private String addressLine2;
        @Size(max=80) private String city;
        @Size(max=80) private String state;
        @Size(max=20) private String postalCode;
        @NotBlank @Size(min=6) private String password;
        @NotNull private User.Role role;
    }

    @Data public static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;
    }

    @Data @lombok.Builder public static class AuthResponse {
        private String token;
        private String tokenType;
        private UUID userId;
        private String name;
        private String email;
        private String phone;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String postalCode;
        private User.Role role;
    }

    @Data @lombok.Builder public static class UserResponse {
        private UUID id;
        private String name;
        private String email;
        private String phone;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String postalCode;
        private User.Role role;
        private String status;
        private LocalDateTime createdAt;
    }
}
