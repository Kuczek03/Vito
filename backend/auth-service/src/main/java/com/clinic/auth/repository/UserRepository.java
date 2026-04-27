package com.clinic.auth.repository;

import com.clinic.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailHash(String emailHash);

    boolean existsByEmailHash(String emailHash);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}
