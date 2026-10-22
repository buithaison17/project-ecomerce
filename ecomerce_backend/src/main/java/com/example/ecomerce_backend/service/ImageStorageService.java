package com.example.ecomerce_backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.ecomerce_backend.exception.BadRequestException;
import com.example.ecomerce_backend.exception.ImageStorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/** Lưu ảnh sản phẩm trên Cloudinary (thay cho việc lưu file trên ổ đĩa server). */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImageStorageService {
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.folder:ecommerce/products}")
    private String folder;

    /** Kết quả upload: url (https) để hiển thị và publicId để xóa về sau. */
    public record StoredImage(String url, String publicId) {
    }

    public StoredImage upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File ảnh không được để trống");
        }
        if (file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF");
        }
        assertConfigured();
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image"
            ));
            Object url = result.get("secure_url");
            Object publicId = result.get("public_id");
            if (url == null || publicId == null) {
                throw new ImageStorageException("Cloudinary không trả về địa chỉ ảnh");
            }
            log.info("Upload ảnh lên Cloudinary thành công publicId={}", publicId);
            return new StoredImage(url.toString(), publicId.toString());
        } catch (IOException e) {
            log.error("Upload ảnh lên Cloudinary thất bại", e);
            throw new ImageStorageException("Không thể tải ảnh lên Cloudinary, vui lòng thử lại", e);
        } catch (RuntimeException e) {
            if (e instanceof ImageStorageException) {
                throw e;
            }
            // Cloudinary SDK ném RuntimeException khi sai API key/secret hoặc file không phải ảnh hợp lệ
            log.error("Cloudinary từ chối upload ảnh", e);
            throw new ImageStorageException("Cloudinary từ chối ảnh tải lên: " + e.getMessage(), e);
        }
    }

    /** Xóa ảnh trên Cloudinary. Không ném lỗi: ảnh còn sót trên Cloud không được làm hỏng nghiệp vụ chính. */
    public void delete(String publicId) {
        if (publicId == null || publicId.isBlank() || cloudName == null || cloudName.isBlank()) {
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image", "invalidate", true));
            log.info("Đã xóa ảnh trên Cloudinary publicId={}", publicId);
        } catch (Exception e) {
            log.warn("Không xóa được ảnh trên Cloudinary publicId={}: {}", publicId, e.getMessage());
        }
    }

    private void assertConfigured() {
        if (cloudName == null || cloudName.isBlank()) {
            throw new ImageStorageException(
                    "Chưa cấu hình Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)");
        }
    }
}
