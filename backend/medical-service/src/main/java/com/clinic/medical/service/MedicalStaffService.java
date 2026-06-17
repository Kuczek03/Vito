package com.clinic.medical.service;

import com.clinic.medical.dto.StaffRequest;
import com.clinic.medical.dto.StaffResponse;
import com.clinic.medical.exception.AccessDeniedException;
import com.clinic.medical.exception.ConflictException;
import com.clinic.medical.model.MedicalStaff;
import com.clinic.medical.repository.MedicalStaffRepository;
import com.clinic.medical.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalStaffService {

    private final MedicalStaffRepository staffRepository;
    private final EncryptionService      encryptionService;

    @Transactional(readOnly = true)
    public List<StaffResponse> getAll() {
        return staffRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public StaffResponse create(StaffRequest req) {
        if (!SecurityUtils.isAdmin()) {
            throw new AccessDeniedException("Tylko administrator może dodawać personel medyczny.");
        }
        if (staffRepository.findByUserId(req.getUserId()).isPresent()) {
            throw new ConflictException("Ten użytkownik jest już zarejestrowany jako personel.");
        }
        if (req.getLicenseNumber() != null &&
                staffRepository.findByLicenseNumber(req.getLicenseNumber()).isPresent()) {
            throw new ConflictException("Numer licencji już istnieje w bazie.");
        }

        MedicalStaff staff = MedicalStaff.builder()
                .userId(req.getUserId())
                .username(req.getUsername())
                .firstName(encryptionService.encrypt(req.getFirstName()))
                .lastName(encryptionService.encrypt(req.getLastName()))
                .specialization(req.getSpecialization())
                .licenseNumber(req.getLicenseNumber())
                .build();

        staffRepository.save(staff);
        log.info("MedicalStaff created id={} userId={}", staff.getId(), staff.getUserId());
        return toResponse(staff);
    }

    private StaffResponse toResponse(MedicalStaff s) {
        return StaffResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .username(s.getUsername())
                .firstName(safeDecrypt(s.getFirstName()))
                .lastName(safeDecrypt(s.getLastName()))
                .specialization(s.getSpecialization())
                .licenseNumber(s.getLicenseNumber())
                .build();
    }

    /** Bezpieczne deszyfrowanie — jeśli dane są plaintextem (stare rekordy), zwróć jak są */
    private String safeDecrypt(String value) {
        if (value == null) return null;
        try {
            return encryptionService.decrypt(value);
        } catch (Exception e) {
            log.warn("Nie można odszyfrować wartości, zwracam plaintext (stary rekord): {}", e.getMessage());
            return value;
        }
    }
}
