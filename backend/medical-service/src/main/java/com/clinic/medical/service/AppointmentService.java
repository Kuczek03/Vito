package com.clinic.medical.service;

import com.clinic.medical.dto.AppointmentRequest;
import com.clinic.medical.dto.AppointmentResponse;
import com.clinic.medical.dto.NurseNotesRequest;
import com.clinic.medical.exception.AccessDeniedException;
import com.clinic.medical.exception.NotFoundException;
import com.clinic.medical.model.Appointment;
import com.clinic.medical.model.AppointmentStatus;
import com.clinic.medical.model.MedicalStaff;
import com.clinic.medical.model.Patient;
import com.clinic.medical.repository.AppointmentRepository;
import com.clinic.medical.repository.MedicalStaffRepository;
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
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository     patientRepository;
    private final MedicalStaffRepository medicalStaffRepository;
    private final EncryptionService     encryptionService;

    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
    Patient patient = findPatient(request.getPatientId());

    // Jeśli zwykły PATIENT — może umawiać tylko siebie
    if (SecurityUtils.isPatient()) {
        if (!patient.getUserId().equals(SecurityUtils.getCurrentUserId())) {
            throw new AccessDeniedException("Możesz umawiać wizyty tylko dla siebie.");
        }
    }
    // Admin, Doctor, Nurse mogą umawiać dla dowolnego pacjenta


        MedicalStaff doctor = findDoctor(request.getDoctorId());

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .status(AppointmentStatus.SCHEDULED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        appointmentRepository.save(appointment);
        log.info("Appointment created id={} patient={} doctor={}",
            appointment.getId(), patient.getId(), doctor.getId());
        return toResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getForCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();

        if (SecurityUtils.isPatient()) {
            Patient patient = patientRepository.findByUserId(userId)
                    .orElseThrow(() -> new NotFoundException("Nie znaleziono profilu pacjenta."));
            return appointmentRepository.findByPatient_Id(patient.getId())
                    .stream().map(this::toResponse).toList();
        }

        if (SecurityUtils.isDoctor()) {
            MedicalStaff staff = medicalStaffRepository.findByUserId(userId)
                    .orElseThrow(() -> new NotFoundException("Nie znaleziono profilu lekarza."));
            return appointmentRepository.findByDoctor_Id(staff.getId())
                    .stream().map(this::toResponse).toList();
        }

        return appointmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public AppointmentResponse cancel(Long id) {
        Appointment appointment = findById(id);
        checkWriteAccess(appointment);
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);
        log.info("Appointment cancelled id={} by userId={}", id, SecurityUtils.getCurrentUserId());
        return toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse addNurseNotes(Long id, NurseNotesRequest request) {
        if (!SecurityUtils.isNurse() && !SecurityUtils.isAdmin()) {
            throw new AccessDeniedException("Tylko pielęgniarka może dodawać notatki.");
        }
        Appointment appointment = findById(id);
        appointment.setNurseNotes(encryptionService.encrypt(request.getNotes()));
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);
        log.info("Nurse notes added to appointment id={}", id);
        return toResponse(appointment);
    }

    private void checkWriteAccess(Appointment appointment) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (SecurityUtils.isAdmin()) return;
        if (SecurityUtils.isPatient() && appointment.getPatient().getUserId().equals(userId)) return;
        if (SecurityUtils.isDoctor() && appointment.getDoctor().getUserId().equals(userId)) return;
        throw new AccessDeniedException("Brak uprawnień do modyfikacji tej wizyty.");
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(encryptionService.decrypt(a.getPatient().getFirstName()) + " "
                           + encryptionService.decrypt(a.getPatient().getLastName()))
                .doctorId(a.getDoctor().getId())
                .doctorName(encryptionService.decrypt(a.getDoctor().getFirstName()) + " "
                          + encryptionService.decrypt(a.getDoctor().getLastName()))
                .appointmentDate(a.getAppointmentDate())
                .status(a.getStatus())
                .build();
    }

    private Appointment  findById(Long id)     { return appointmentRepository.findById(id).orElseThrow(() -> new NotFoundException("Wizyta id=" + id + " nie istnieje.")); }
    private Patient      findPatient(Long id)  { return patientRepository.findById(id).orElseThrow(() -> new NotFoundException("Pacjent id=" + id + " nie istnieje.")); }
    private MedicalStaff findDoctor(Long id)   { return medicalStaffRepository.findById(id).orElseThrow(() -> new NotFoundException("Lekarz id=" + id + " nie istnieje.")); }
}
