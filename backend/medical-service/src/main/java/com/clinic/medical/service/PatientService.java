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

    private final PatientRepository patientRepository;
    private final EncryptionService encryptionService;

    @Transactional
    public PatientResponse create(PatientRequest request) {
        String peselHash = encryptionService.hash(request.getPesel());
        if (patientRepository.existsByPeselHash(peselHash)) {
            throw new ConflictException("Pacjent z tym numerem PESEL już istnieje.");
        }

        Long targetUserId;
        if (SecurityUtils.isPatient()) {
            targetUserId = SecurityUtils.getCurrentUserId();
        } else if (SecurityUtils.isAdmin() || SecurityUtils.isDoctor() || SecurityUtils.isNurse()) {
            targetUserId = request.getUserId();
        } else {
            throw new AccessDeniedException("Brak uprawnień do tworzenia profilu pacjenta.");
        }

        if (targetUserId != null && patientRepository.findByUserId(targetUserId).isPresent()) {
            throw new ConflictException("Ten użytkownik ma już profil pacjenta.");
        }

        Patient patient = Patient.builder()
                .userId(targetUserId)
                .firstName(encryptionService.encrypt(request.getFirstName()))
                .lastName(encryptionService.encrypt(request.getLastName()))
                .pesel(encryptionService.encrypt(request.getPesel()))
                .peselHash(peselHash)
                .phoneNumber(request.getPhoneNumber() != null
                    ? encryptionService.encrypt(request.getPhoneNumber()) : null)
                .createdAt(Instant.now())
                .build();

        patientRepository.save(patient);
        log.info("Patient created id={} userId={}", patient.getId(), targetUserId);
        return toResponse(patient);
    }

    @Transactional
    public PatientResponse update(Long id, PatientRequest request) {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.isDoctor() && !SecurityUtils.isNurse()) {
            throw new AccessDeniedException("Brak uprawnień do edycji profilu pacjenta.");
        }
        Patient patient = findById(id);
        patient.setFirstName(encryptionService.encrypt(request.getFirstName()));
        patient.setLastName(encryptionService.encrypt(request.getLastName()));
        if (request.getPhoneNumber() != null) {
            patient.setPhoneNumber(encryptionService.encrypt(request.getPhoneNumber()));
        }
        patientRepository.save(patient);
        log.info("Patient updated id={}", id);
        return toResponse(patient);
    }

    @Transactional
    public PatientResponse linkAccount(Long patientId, Long userId) {
        if (!SecurityUtils.isAdmin()) {
            throw new AccessDeniedException("Tylko administrator może powiązać konto z profilem pacjenta.");
        }
        Patient patient = findById(patientId);
        if (patient.getUserId() != null) {
            throw new ConflictException("Ten profil jest już powiązany z kontem userId=" + patient.getUserId());
        }
        if (patientRepository.findByUserId(userId).isPresent()) {
            throw new ConflictException("To konto jest już powiązane z innym profilem pacjenta.");
        }
        patient.setUserId(userId);
        patientRepository.save(patient);
        log.info("Patient id={} linked to userId={}", patientId, userId);
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
        String pesel = safeDecrypt(patient.getPesel());
        return PatientResponse.builder()
                .id(patient.getId())
                .userId(patient.getUserId())
                .firstName(safeDecrypt(patient.getFirstName()))
                .lastName(safeDecrypt(patient.getLastName()))
                .pesel(maskPesel(pesel))
                .phoneNumber(patient.getPhoneNumber() != null
                    ? safeDecrypt(patient.getPhoneNumber()) : null)
                .build();
    }

    private String safeDecrypt(String value) {
        if (value == null) return null;
        try { return encryptionService.decrypt(value); }
        catch (Exception e) { log.warn("safeDecrypt plaintext fallback"); return value; }
    }

    private String maskPesel(String pesel) {
        if (pesel == null || pesel.length() < 6) return "***";
        return pesel.substring(0, 6) + "*".repeat(pesel.length() - 6);
    }

    private void checkReadAccess(Patient patient) {
        if (SecurityUtils.isAdmin() || SecurityUtils.isDoctor() || SecurityUtils.isNurse()) return;
        if (patient.getUserId() == null || !patient.getUserId().equals(SecurityUtils.getCurrentUserId())) {
            throw new AccessDeniedException("Brak dostępu do danych tego pacjenta.");
        }
    }

    private Patient findById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Pacjent o id=" + id + " nie istnieje."));
    }
}
