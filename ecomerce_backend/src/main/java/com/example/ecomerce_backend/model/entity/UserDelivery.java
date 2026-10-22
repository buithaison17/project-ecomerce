package com.example.ecomerce_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/** Thông tin nhận hàng. Mỗi đơn hàng lưu một bản riêng để đơn cũ không bị đổi khi người dùng sửa địa chỉ. */
@Entity
@Table(name = "user_deliveries")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class UserDelivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(nullable = false)
    private User user;
    @Column(nullable = false)
    private String receiverName;
    @Column(nullable = false)
    private String address;
    @Column(nullable = false)
    private String phoneNumber;
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    @Builder.Default
    private Boolean isDeleted = false;
}
