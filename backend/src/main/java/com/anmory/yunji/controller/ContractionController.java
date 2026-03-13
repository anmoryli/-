package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.Contraction;
import com.anmory.yunji.service.ContractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/contraction")
public class ContractionController {

    @Autowired
    private ContractionService contractionService;

    @PostMapping("/add")
    public Result<Contraction> add(@RequestParam("userId") Integer userId,
                                   @RequestParam("startedAt") LocalDateTime startedAt,
                                   @RequestParam("durationSeconds") int durationSeconds) {
        Contraction c = contractionService.add(userId, startedAt, durationSeconds);
        return Result.success(c);
    }

    @GetMapping("/list")
    public Result<List<Contraction>> list(@RequestParam("userId") Integer userId,
                                         @RequestParam("date") LocalDate date) {
        List<Contraction> list = contractionService.listByDate(userId, date);
        return Result.success(list);
    }

    @DeleteMapping("/clear")
    public Result<Void> clear(@RequestParam("userId") Integer userId,
                              @RequestParam("date") LocalDate date) {
        contractionService.clearByDate(userId, date);
        return Result.success();
    }
}
