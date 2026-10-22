package com.example.ecomerce_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_images")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class ProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(nullable = false)
    private Product product;
    /** URL tuyệt đối (https) của ảnh, ví dụ https://res.cloudinary.com/.../abc.jpg */
    @Column(length = 500)
    private String url;
    /** public_id trên Cloudinary, dùng để xóa ảnh. Null nếu ảnh là URL ngoài do admin tự nhập. */
    @Column(length = 255)
    private String publicId;
    @Builder.Default
    private Boolean isDeleted = false;
}
