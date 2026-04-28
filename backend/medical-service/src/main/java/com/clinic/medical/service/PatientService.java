package com.clinic.medical.service;

import com.clinic.medical.dto.PatientRequest;
import com.clinic.medical.dto.PatientResponse;
import com.clinic.medical.exception.AccessDeniedException;
import com.clinic.medical.exception.ConflictException;
import com.clinic.medical.exception.NotFoundException;
import com.clinic.medical.model.Patient;
import com.clinic.medical.repository.PatientRepository;
import com.clinic.medical.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository  patientRepository;
    private final EncryptionService  encryptionService;

    @Transactional
    public PatientResponse create(PatientRequest request) {
        String peselHash = encryptionService.hash(request.getPesel());
        if (patientRepository.existsByPeselHash(peselHash)) {
            throw new ConflictException("Pacjent z tym numerem PESEL już istnieje.");
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();

        Patient patient = Patient.builder()
                .userId(currentUserId)
                .firstName(encryptionService.encrypt(request.getFirstName()))
                .lastName(encryptionService.encrypt(request.getLastName()))
                .pesel(encryptionService.encrypt(request.getPesel()))
                .peselHash(peselHash)
                .phoneNumber(encryptionService.encrypt(request.getPhoneNumber()))
                .createdAt(Instant.now())
                .build();

        patientRepository.save(patient);
        log.info("Patient profile created id={} by userId={}", patient.getId(), currentUserId);
        return toResponse(patient);
    }

    @Transactional(readOnly = true)
    public PatientResponse getById(Long id) {
        Patient patient = findById(id);
        checkReadAccess(patient);
        return toResponse(patient);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getAll() {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.isDoctor() && !SecurityUtils.isNurse()) {
            throw new AccessDeniedException("Brak uprawnień do przeglądania listy pacjentów.");
        }
        return patientRepository.findAll().stream().map(this::toResponse).toList();
    }

    private PatientResponse toResponse(Patient patient) {
        String decryptedPesel = encryptionService.decrypt(patient.getPesel());
        return PatientResponse.builder()
                .id(patient.getId())
                .userId(patient.getUserId())
                .firstName(encryptionService.decrypt(patient.getFirstName()))
                .lastName(encryptionService.decrypt(patient.getLastName()))
                .pesel(maskPesel(decryptedPesel))
                .phoneNumber(encryptionService.decrypt(patient.getPhoneNumber()))
                .build();
    }

    private String maskPesel(String pesel) {
        if (pesel == null || pesel.length() < 6) return "***";
        return pesel.substring(0, 6) + "*".repeat(pesel.length() - 6);
    }

    private void checkReadAccess(Patient patient) {
        if (SecurityUtils.isAdmin() || SecurityUtils.isDoctor() || SecurityUtils.isNurse()) return;
        if (!patient.getUserId().equals(SecurityUtils.getCurrentUserId())) {
            throw new AccessDeniedException("Brak dostępu do danych tego pacjenta.");
        }
    }

    private Patient findById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Pacjent o id=" + id + " nie istnieje."));
    }
}
