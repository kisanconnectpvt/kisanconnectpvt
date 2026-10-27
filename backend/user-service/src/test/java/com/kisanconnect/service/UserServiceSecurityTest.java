package com.kisanconnect.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.kisanconnect.dto.UserDto.RegisterRequest;
import com.kisanconnect.entity.User;
import com.kisanconnect.kafka.UserEventProducer;
import com.kisanconnect.repository.UserRepository;
import com.kisanconnect.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class UserServiceSecurityTest {
    @Test
    void rejectsAdminSelfRegistrationBeforePersistence() {
        UserRepository repository = mock(UserRepository.class);
        UserService service = new UserService(repository, mock(PasswordEncoder.class),
                mock(JwtUtil.class), mock(UserEventProducer.class));
        RegisterRequest request = new RegisterRequest();
        request.setRole(User.Role.ADMIN);

        assertThrows(IllegalArgumentException.class, () -> service.register(request));
        verifyNoInteractions(repository);
    }
}