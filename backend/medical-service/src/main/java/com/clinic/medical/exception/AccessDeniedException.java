package com.clinic.medical.exception;
public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) { super(message); }
}
