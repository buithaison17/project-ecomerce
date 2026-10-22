package com.example.ecomerce_backend.repository;

import com.example.ecomerce_backend.model.entity.UserDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserDeliveryRepository extends JpaRepository<UserDelivery, Long> {
}
