package com.civicsync.CivicSync_Backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * 🛡️ Turns unhandled exceptions into clean JSON error bodies instead of raw
 * Spring 500 stack-trace pages. Covers the plain RuntimeExceptions thrown by
 * confirmResolution() (wrong citizen, wrong status) and assignOfficer()
 * (user isn't a FIELD_OFFICER), so the app can show a real message instead of
 * a generic network-error screen.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        // Everything thrown deliberately in the service layer (bad state transitions,
        // ownership checks, role checks) is a client-facing 400, not a server crash.
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}
