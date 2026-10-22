package com.example.ecomerce_backend.repository;

import com.example.ecomerce_backend.model.entity.Order;
import com.example.ecomerce_backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
   Optional<Order> findByIdAndUser(Long id, User user);
}
