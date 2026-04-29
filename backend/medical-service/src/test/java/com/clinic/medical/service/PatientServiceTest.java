package com.clinic.medical.service;

import com.clinic.medical.dto.PatientRequest;
import com.clinic.medical.exception.ConflictException;
import com.clinic.medical.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private EncryptionService encryptionService;

    @InjectMocks
    private PatientService patientService;

    @Test
    void shouldThrowConflictExceptionWhenPeselAlreadyExists() {
        PatientRequest request = new PatientRequest();
        request.setFirstName("Jan");
        request.setLastName("Kowalski");
        request.setPesel("90010112345");
        request.setPhoneNumber("123456789");

        String fakeHash = "zahasowanyPesel123";
        when(encryptionService.hash("90010112345")).thenReturn(fakeHash);

        when(patientRepository.existsByPeselHash(fakeHash)).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> {
            patientService.create(request);
        });

        assertEquals("Pacjent z tym numerem PESEL już istnieje.", exception.getMessage());

        verify(patientRepository, never()).save(any());
    }
}