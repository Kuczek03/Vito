package com.clinic.medical.repository;

import com.clinic.medical.model.MedicalStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MedicalStaffRepository extends JpaRepository<MedicalStaff, Long> {
    Optional<MedicalStaff> findByUserId(Long userId);
    Optional<MedicalStaff> findByLicenseNumber(String licenseNumber);
}
