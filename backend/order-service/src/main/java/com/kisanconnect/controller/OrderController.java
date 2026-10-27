package com.kisanconnect.controller;
import com.kisanconnect.dto.OrderDto.*;
import com.kisanconnect.security.JwtUtil;
import com.kisanconnect.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/orders")
@RequiredArgsConstructor @Tag(name="Orders", description="Order placement and tracking APIs")
public class OrderController {
    private final OrderService service;
    private final JwtUtil jwtUtil;

    @PostMapping
    @Operation(summary="Place a new order", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<OrderResponse> create(
            @RequestHeader("Authorization") String auth, @Valid @RequestBody CreateOrderRequest req) {
        if (!"BUYER".equals(jwtUtil.getRole(token(auth)))) {
            throw new org.springframework.security.access.AccessDeniedException("Buyer access required");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createOrder(extractId(auth), req));
    }

    @GetMapping("/my")
    @Operation(summary="Get my orders (buyer)", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<List<OrderResponse>> myOrders(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(service.getMyOrders(extractId(auth)));
    }

    @GetMapping("/{id}")
    @Operation(summary="Get order by ID", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<OrderResponse> getById(@PathVariable UUID id,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(service.getById(id, extractId(auth), jwtUtil.getRole(token(auth))));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary="Update order status", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable UUID id, @RequestParam String status,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(service.updateStatus(id, status, extractId(auth), jwtUtil.getRole(token(auth))));
    }

    private UUID extractId(String auth) {
        return UUID.fromString(jwtUtil.getUserId(token(auth)));
    }

    private String token(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new org.springframework.security.access.AccessDeniedException("Bearer token required");
        }
        return authorization.substring(7);
    }
}
