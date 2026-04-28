package com.clinic.medical.repository;

import com.clinic.medical.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPeselHash(String peselHash);
    boolean existsByPeselHash(String peselHash);
    Optional<Patient> findByUserId(Long userId);
}
