package com.clinic.medical.repository;

import com.clinic.medical.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatient_Id(Long patientId);
    List<Appointment> findByDoctor_Id(Long doctorId);
    List<Appointment> findByDoctor_IdAndStatus(Long doctorId, com.clinic.medical.model.AppointmentStatus status);
}
