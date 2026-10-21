package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.exception.BadRequestException;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {
    public static final String PUBLIC_PREFIX = "/uploads/";
    // Chỉ chấp nhận ảnh; đuôi file lấy từ whitelist này, không lấy từ tên file người dùng gửi lên
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    @Getter
    private final Path root;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Không thể tạo thư mục upload: " + root, e);
        }
    }

    /** Lưu ảnh và trả về đường dẫn public, ví dụ /uploads/3f2a....jpg */
    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File ảnh không được để trống");
        }
        String extension = ALLOWED_TYPES.get(file.getContentType());
        if (extension == null) {
            throw new BadRequestException("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF");
        }
        String filename = UUID.randomUUID() + extension;
        Path target = root.resolve(filename).normalize();
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Không thể lưu file ảnh", e);
        }
        return PUBLIC_PREFIX + filename;
    }
}
