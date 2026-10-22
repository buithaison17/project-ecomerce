package com.example.ecomerce_backend.repository;

import com.example.ecomerce_backend.model.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    /** Nạp sẵn user + delivery trong cùng câu query để danh sách đơn hàng không bị N+1. */
    @Override
    @EntityGraph(attributePaths = {"user", "delivery"})
    Page<Order> findAll(Specification<Order> spec, Pageable pageable);
}
