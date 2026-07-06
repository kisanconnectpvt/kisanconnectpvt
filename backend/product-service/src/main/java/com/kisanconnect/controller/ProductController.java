package com.kisanconnect.controller;
import com.kisanconnect.dto.ProductDto.*;
import com.kisanconnect.security.JwtUtil;
import com.kisanconnect.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

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
            @RequestHeader(value = "Authorization", required = false) String auth,
            @Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(extractId(auth), req));
    }

    @PutMapping("/{id}")
    @Operation(summary="Update a product (owner only)", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<ProductResponse> update(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody UpdateRequest req) {
        return ResponseEntity.ok(service.update(id, extractId(auth), req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary="Soft-delete a product (owner only)", security=@SecurityRequirement(name="Bearer"))
    public ResponseEntity<Void> delete(@PathVariable UUID id, @RequestHeader(value = "Authorization", required = false) String auth) {
        service.delete(id, extractId(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/stock")
    @Operation(summary="Decrease stock for a product")
    public ResponseEntity<Void> decreaseStock(@PathVariable UUID id, @RequestParam BigDecimal quantity) {
        service.decreaseStock(id, quantity);
        return ResponseEntity.ok().build();
    }

    private UUID extractId(String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid credentials: missing or invalid Authorization header");
        }
        try {
            return UUID.fromString(jwtUtil.getUserId(auth.substring(7)));
        } catch (Exception ex) {
            throw new RuntimeException("Invalid credentials");
        }
    }
}
