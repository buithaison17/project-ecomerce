package com.example.ecomerce_backend.repository;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.model.dto.response.OrderResponse;
import com.example.ecomerce_backend.model.entity.Order;
import com.example.ecomerce_backend.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
   Optional<Order> findByIdAndUser(Long id, User user);

    Page<Order> findByIsDeleted(Boolean isDeleted, Pageable pageable);

    Page<Order> findByIsDeletedAndOrderStatus(Boolean isDeleted, OrderStatus orderStatus, Pageable pageable);

    Page<Order> findByIsDeletedAndUser(Boolean isDeleted, User user, Pageable pageable);

    Page<Order> findByIsDeletedAndUserAndOrderStatus(Boolean isDeleted, User user, OrderStatus orderStatus, Pageable pageable);
}
