package com.vaultx.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaultx.dto.chat.ChatRequestDto;
import com.vaultx.dto.chat.ChatResponseDto;
import com.vaultx.entity.DocumentAiMetadata;
import com.vaultx.entity.OcrResult;
import com.vaultx.repository.DocumentAiMetadataRepository;
import com.vaultx.repository.OcrResultRepository;
import com.vaultx.service.AiChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AiChatServiceImpl implements AiChatService {

    private final DocumentAiMetadataRepository metadataRepository;
    private final OcrResultRepository ocrResultRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${vaultx.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${vaultx.ai.gemini.chat-model:gemini-3.1-flash-lite}")
    private String geminiModel;

    @Override
    public ChatResponseDto askQuestion(UUID userId, ChatRequestDto requestDto) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return new ChatResponseDto("Error: Gemini API Key is not configured.");
        }

        List<DocumentAiMetadata> allDocs = metadataRepository.findByDocumentOwnerIdAndDocumentDeletedFalse(userId);
        if (allDocs.isEmpty()) {
            return new ChatResponseDto("You don't have any uploaded documents yet.");
        }

        // STEP 1: Routing (Find relevant documents)
        StringBuilder docCatalog = new StringBuilder();
        for (DocumentAiMetadata meta : allDocs) {
            docCatalog.append(String.format("ID: %s, Name: %s, Category: %s, Type: %s\n",
                    meta.getDocument().getId(),
                    meta.getDocument().getDisplayName(),
                    meta.getDetectedCategory(),
                    meta.getDetectedType()
            ));
        }

        String routingPrompt = String.format("""
                You are a smart document router. Based on the user's question, determine which document IDs might contain the answer.
                Output ONLY a JSON array of up to 3 document IDs in plain text without markdown format. E.g. ["uuid1", "uuid2"].
                If the question is general and doesn't seem to apply to any document, output [].
                
                USER QUESTION: %s
                
                DOCUMENT CATALOG:
                %s
                """, requestDto.getMessage(), docCatalog.toString());

        List<UUID> relevantDocIds = new ArrayList<>();
        try {
            String routingResponse = callGemini(routingPrompt);
            // Clean markdown if present
            routingResponse = routingResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode arrayNode = objectMapper.readTree(routingResponse);
            if (arrayNode.isArray()) {
                for (JsonNode idNode : arrayNode) {
                    try {
                        relevantDocIds.add(UUID.fromString(idNode.asText()));
                    } catch (Exception ignored) {}
                }
            }
        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            log.error("Gemini API Rate Limit Exceeded during routing", e);
            return new ChatResponseDto("I'm currently receiving too many requests. Please try again in about a minute.");
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            log.error("Gemini API Model Not Found during routing", e);
            return new ChatResponseDto("Error: The configured Gemini model (" + geminiModel + ") was not found. Please check your application.yml configuration.");
        } catch (org.springframework.web.client.HttpClientErrorException.BadRequest e) {
            log.error("Gemini API Bad Request during routing", e);
            return new ChatResponseDto("Error: Invalid request to Gemini API. Your API key might be invalid or restricted.");
        } catch (Exception e) {
            log.warn("Routing step failed, falling back to recent docs.", e);
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                return new ChatResponseDto("I'm currently receiving too many requests. Please try again in about a minute.");
            }
        }

        // If no relevant docs found by AI, use up to 3 most recent docs as fallback
        if (relevantDocIds.isEmpty()) {
            int limit = Math.min(3, allDocs.size());
            for (int i = 0; i < limit; i++) {
                relevantDocIds.add(allDocs.get(i).getDocument().getId());
            }
        }

        // STEP 2: Gather OCR Context and Answer
        StringBuilder contextBuilder = new StringBuilder();
        for (UUID docId : relevantDocIds) {
            Optional<OcrResult> ocrOpt = ocrResultRepository.findFirstByDocumentIdOrderByProcessedAtDesc(docId);
            if (ocrOpt.isPresent() && ocrOpt.get().getExtractedText() != null) {
                DocumentAiMetadata meta = allDocs.stream().filter(d -> d.getDocument().getId().equals(docId)).findFirst().orElse(null);
                String docName = meta != null ? meta.getDocument().getDisplayName() : docId.toString();
                contextBuilder.append("--- Document: ").append(docName).append(" ---\n");
                // Limit individual doc text to prevent blowing up the context (e.g. 50k chars per doc)
                String text = ocrOpt.get().getExtractedText();
                if (text.length() > 50000) {
                    text = text.substring(0, 50000);
                }
                contextBuilder.append(text).append("\n\n");
            }
        }

        String answerPrompt = String.format("""
                You are VaultX AI, a helpful and accurate assistant.
                Answer the user's question based strictly on the following document context.
                If the answer is not contained in the context, say "I cannot find the answer in your documents."
                Keep the answer concise, nicely formatted, and directly address the user.
                
                CONTEXT:
                %s
                
                USER QUESTION: %s
                """, contextBuilder.toString(), requestDto.getMessage());

        try {
            String answer = callGemini(answerPrompt);
            return new ChatResponseDto(answer);
        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            log.error("Gemini API Rate Limit Exceeded", e);
            return new ChatResponseDto("I'm currently receiving too many requests. Please try again in about a minute.");
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            log.error("Gemini API Model Not Found", e);
            return new ChatResponseDto("Error: The configured Gemini model (" + geminiModel + ") was not found.");
        } catch (org.springframework.web.client.HttpClientErrorException.BadRequest e) {
            log.error("Gemini API Bad Request", e);
            return new ChatResponseDto("Error: Invalid request to Gemini API. Please check your API key.");
        } catch (Exception e) {
            log.error("Failed to generate answer", e);
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                return new ChatResponseDto("I'm currently receiving too many requests. Please try again in about a minute.");
            }
            return new ChatResponseDto("Sorry, I encountered an error while trying to answer your question.");
        }
    }

    private String callGemini(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        parts.add(part);
        content.put("parts", parts);
        contents.add(content);
        requestBody.put("contents", contents);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, entity, JsonNode.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode body = response.getBody();
            if (body.has("candidates") && body.get("candidates").isArray() && body.get("candidates").size() > 0) {
                JsonNode candidate = body.get("candidates").get(0);
                if (candidate.has("content") && candidate.get("content").has("parts")) {
                    return candidate.get("content").get("parts").get(0).get("text").asText();
                }
            }
        }
        throw new RuntimeException("Invalid response from Gemini API");
    }
}
