package com.example.ecomerce_backend.controller;

import com.example.ecomerce_backend.model.dto.request.CategoryRequest;
import com.example.ecomerce_backend.model.dto.response.ApiDataResponse;
import com.example.ecomerce_backend.model.dto.response.CategoryResponse;
import com.example.ecomerce_backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {
    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<ApiDataResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(201)
                .body(ApiDataResponse.created("Tạo danh mục thành công", categoryService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiDataResponse<CategoryResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CategoryRequest request
    ) {
        return ResponseEntity.ok(ApiDataResponse.ok("Cập nhật danh mục thành công", categoryService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiDataResponse<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiDataResponse.ok("Xóa danh mục thành công", null));
    }
}
