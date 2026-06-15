package com.kisanconnect.controller;
import com.kisanconnect.dto.ProductDto.*;
import com.kisanconnect.security.JwtUtil;
import com.kisanconnect.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/products")
@RequiredArgsConstructor @Tag(name="Products", description="Product listing and management APIs")
public class ProductController {
    private final ProductService service;
    private final JwtUtil jwtUtil;

    @GetMapping
    @Operation(summary="Search/list products with optional filters (scale, category, keyword)")
    public ResponseEntity<List<ProductResponse>> list(
            @RequestParam(required=false) String scale,
            @RequestParam(required=false) String category,
            @RequestParam(required=false) String keyword) {
        return ResponseEntity.ok(service.listAll(scale, category, keyword));
    }

    @GetMapping("/{id}")
    @Operation(summary="Get product by ID")
    public ResponseEntity<ProductResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/farmer/{farmerId}")
    @Operation(summary="List all products by a specific farmer")
    public ResponseEntity<List<ProductResponse>> listByFarmer(@PathVariable UUID farmerId) {
        return ResponseEntity.ok(service.listByFarmer(farmerId));
    }

    @PostMapping
    @Operation(summary="Create a new product listing (Farmer only)", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<ProductResponse> create(
            @RequestHeader("Authorization") String auth,
            @Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(extractId(auth), req));
    }

    @PutMapping("/{id}")
    @Operation(summary="Update a product (owner only)", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<ProductResponse> update(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String auth,
            @RequestBody UpdateRequest req) {
        return ResponseEntity.ok(service.update(id, extractId(auth), req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary="Soft-delete a product (owner only)", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<Void> delete(@PathVariable UUID id, @RequestHeader("Authorization") String auth) {
        service.delete(id, extractId(auth));
        return ResponseEntity.noContent().build();
    }

    private UUID extractId(String auth) {
        return UUID.fromString(jwtUtil.getUserId(auth.replace("Bearer ", "")));
    }
}
