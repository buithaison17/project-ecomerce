package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.exception.BadRequestException;
import com.example.ecomerce_backend.exception.ResourceExistedException;
import com.example.ecomerce_backend.exception.ResourceNotFoundException;
import com.example.ecomerce_backend.model.dto.request.CategoryRequest;
import com.example.ecomerce_backend.model.dto.response.CategoryResponse;
import com.example.ecomerce_backend.model.entity.Category;
import com.example.ecomerce_backend.model.mapper.CatalogMapper;
import com.example.ecomerce_backend.repository.CategoryRepository;
import com.example.ecomerce_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CatalogMapper mapper;

    /**
     * Lấy danh sách tất cả danh mục đang hoạt động
     * @return Danh sách CategoryResponse
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAllActive().stream().map(mapper::toCategoryResponse).toList();
    }

    /**
     * Tạo danh mục mới
     * @param request Thông tin danh mục cần tạo
     * @return CategoryResponse của danh mục vừa tạo
     * @throws ResourceExistedException Nếu tên danh mục đã tồn tại
     */
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.existsActiveByName(name)) {
            throw new ResourceExistedException("Danh mục đã tồn tại");
        }
        Category category = categoryRepository.save(Category.builder()
                .name(name)
                .description(request.description())
                .build());
        log.info("Tạo danh mục id={} name={}", category.getId(), category.getName());
        return mapper.toCategoryResponse(category);
    }

    /**
     * Cập nhật thông tin danh mục
     * @param id ID của danh mục cần cập nhật
     * @param request Thông tin mới của danh mục
     * @return CategoryResponse sau khi cập nhật
     * @throws ResourceExistedException Nếu tên danh mục đã tồn tại (trừ danh mục hiện tại)
     * @throws ResourceNotFoundException Nếu không tìm thấy danh mục
     */
    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = findActive(id);
        String name = request.name().trim();
        if (categoryRepository.existsActiveByNameAndIdNot(name, id)) {
            throw new ResourceExistedException("Danh mục đã tồn tại");
        }
        category.setName(name);
        category.setDescription(request.description());
        log.info("Cập nhật danh mục id={}", id);
        return mapper.toCategoryResponse(category);
    }

    /**
     * Xóa mềm danh mục (đánh dấu isDeleted = true)
     * @param id ID của danh mục cần xóa
     * @throws BadRequestException Nếu danh mục đang có sản phẩm
     * @throws ResourceNotFoundException Nếu không tìm thấy danh mục
     */
    @Transactional
    public void delete(Long id) {
        Category category = findActive(id);
        if (productRepository.existsActiveByCategoryId(id)) {
            throw new BadRequestException("Không thể xóa danh mục đang có sản phẩm");
        }
        category.setIsDeleted(true);
        log.info("Xóa (mềm) danh mục id={}", id);
    }

    /**
     * Tìm danh mục đang hoạt động theo ID
     * @param id ID của danh mục
     * @return Entity Category
     * @throws ResourceNotFoundException Nếu không tìm thấy danh mục
     */
    Category findActive(Long id) {
        return categoryRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục id=" + id));
    }
}
