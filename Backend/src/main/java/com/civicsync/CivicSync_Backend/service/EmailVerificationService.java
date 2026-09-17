package com.civicsync.CivicSync_Backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class EmailVerificationService {

    @Autowired
    private JavaMailSender mailSender;

    // Stores email -> OTP code temporarily in memory
    private final Map<String, String> otpStorage = new HashMap<>();

    public void sendVerificationEmail(String targetEmail) {
        // Generate a random 6-digit OTP code
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(targetEmail, otpCode);

        // Build the transactional email message
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("lingeshprt2008@gmail.com");
        message.setTo(targetEmail);
        message.setSubject("CivicSync - Verify Your Email Account");
        message.setText("Welcome to CivicSync!\n\nYour security confirmation code is: " + otpCode +
                "\n\nIf you did not initiate this request, please disregard this communication.");

        mailSender.send(message);
        System.out.println("OTP dispatched successfully to: " + targetEmail);
    }

    public boolean verifyOtp(String email, String inputCode) {
        if (otpStorage.containsKey(email)) {
            return otpStorage.get(email).equals(inputCode);
        }
        return false;
    }

    public void clearOtp(String email) {
        otpStorage.remove(email);
    }
}