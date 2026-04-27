package com.clinic.auth.exception;

public class MfaRequiredException extends RuntimeException {
    public MfaRequiredException(String message) { super(message); }
}
