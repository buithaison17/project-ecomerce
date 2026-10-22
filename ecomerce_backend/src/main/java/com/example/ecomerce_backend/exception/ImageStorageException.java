package com.example.ecomerce_backend.exception;

/** Lỗi khi làm việc với dịch vụ lưu trữ ảnh bên ngoài (Cloudinary): chưa cấu hình, mất kết nối, bị từ chối... */
public class ImageStorageException extends RuntimeException {
    public ImageStorageException(String message) {
        super(message);
    }

    public ImageStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
