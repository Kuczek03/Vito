package com.clinic.medical.service;

import com.clinic.medical.dto.MedicalRecordRequest;
import com.clinic.medical.dto.MedicalRecordResponse;
import com.clinic.medical.exception.AccessDeniedException;
import com.clinic.medical.exception.ConflictException;
import com.clinic.medical.exception.NotFoundException;
import com.clinic.medical.model.Appointment;
import com.clinic.medical.model.AppointmentStatus;
import com.clinic.medical.model.MedicalRecord;
import com.clinic.medical.repository.AppointmentRepository;
import com.clinic.medical.repository.MedicalRecordRepository;
import com.clinic.medical.repository.PatientRepository;
import com.clinic.medical.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository   appointmentRepository;
    private final PatientRepository       patientRepository;
    private final EncryptionService       encryptionService;

    @Transactional
    public MedicalRecordResponse create(Long appointmentId, MedicalRecordRequest request) {
        Appointment appointment = findAppointment(appointmentId);

        checkDoctorAccess(appointment);

        if (medicalRecordRepository.findByAppointment_Id(appointmentId).isPresent()) {
            throw new ConflictException("Dokumentacja dla tej wizyty już istnieje.");
        }

        MedicalRecord record = MedicalRecord.builder()
                .appointment(appointment)
                .diagnosis(encryptionService.encrypt(request.getDiagnosis()))
                .prescription(encryptionService.encrypt(request.getPrescription()))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        medicalRecordRepository.save(record);
        log.info("MedicalRecord created id={} appointmentId={} by userId={}",
            record.getId(), appointmentId, SecurityUtils.getCurrentUserId());

        return toResponse(record);
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponse getByAppointmentId(Long appointmentId) {
        Appointment appointment = findAppointment(appointmentId);
        MedicalRecord record = medicalRecordRepository.findByAppointment_Id(appointmentId)
                .orElseThrow(() -> new NotFoundException("Brak dokumentacji dla tej wizyty."));

        checkReadAccess(appointment);

        return toResponse(record);
    }

    private void checkDoctorAccess(Appointment appointment) {
        if (SecurityUtils.isAdmin()) return;
        if (!SecurityUtils.isDoctor()) {
            throw new AccessDeniedException("Tylko lekarz może tworzyć dokumentację medyczną.");
        }
        Long userId = SecurityUtils.getCurrentUserId();
        if (!appointment.getDoctor().getUserId().equals(userId)) {
            throw new AccessDeniedException("Możesz tworzyć dokumentację tylko dla swoich wizyt.");
        }
    }

    private void checkReadAccess(Appointment appointment) {
        if (SecurityUtils.isAdmin()) return;
        Long userId = SecurityUtils.getCurrentUserId();
        if (SecurityUtils.isDoctor() && appointment.getDoctor().getUserId().equals(userId)) return;
        if (SecurityUtils.isPatient() && appointment.getPatient().getUserId().equals(userId)) return;
        throw new AccessDeniedException("Brak uprawnień do przeglądania tej dokumentacji.");
    }

    private MedicalRecordResponse toResponse(MedicalRecord r) {
        return MedicalRecordResponse.builder()
                .id(r.getId())
                .appointmentId(r.getAppointment().getId())
                .diagnosis(encryptionService.decrypt(r.getDiagnosis()))
                .prescription(encryptionService.decrypt(r.getPrescription()))
                .createdAt(r.getCreatedAt())
                .build();
    }

    private Appointment findAppointment(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Wizyta id=" + id + " nie istnieje."));
    }
}
