package com.vaultx.service;

import com.vaultx.dto.chat.ChatRequestDto;
import com.vaultx.dto.chat.ChatResponseDto;
import java.util.UUID;

public interface AiChatService {
    ChatResponseDto askQuestion(UUID userId, ChatRequestDto requestDto);
}
