package com.example.ecomerce_backend.repository;

import com.example.ecomerce_backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailOrUsername(String email, String username);

    boolean existsByEmailOrUsername(String email, String username);

    boolean existsByEmailAndIdNot(String email, Long id);
}
