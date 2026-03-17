package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RelaxMusic {
    private Integer musicId;
    private String title;
    private String artist;
    private String description;
    private String category;
    private String tags;
    private String fileUrl;
    private String coverUrl;
    private Integer durationSeconds;
    private Integer sortOrder;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
