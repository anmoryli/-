package com.anmory.yunji.dto;

import lombok.Data;

@Data
public class ScenarioEndRequest {
    private Integer userId;
    private Integer conversationId;
    private String reason;
}
