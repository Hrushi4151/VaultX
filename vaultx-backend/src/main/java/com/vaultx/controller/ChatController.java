package com.vaultx.controller;

import com.vaultx.common.ApiResponse;
import com.vaultx.dto.chat.ChatRequestDto;
import com.vaultx.dto.chat.ChatResponseDto;
import com.vaultx.entity.User;
import com.vaultx.service.AiChatService;
import jakarta.validation.Valid;
import com.vaultx.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final AiChatService aiChatService;
    private final UserRepository userRepository;

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<ChatResponseDto>> askQuestion(
            @Valid @RequestBody ChatRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
            
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        ChatResponseDto response = aiChatService.askQuestion(user.getId(), requestDto);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }
}
