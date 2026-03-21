package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.dto.ScenarioEndRequest;
import com.anmory.yunji.entity.Scenario;
import com.anmory.yunji.entity.ScenarioReport;
import com.anmory.yunji.service.ScenarioReportService;
import com.anmory.yunji.service.ScenarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/scenario")
@RequiredArgsConstructor
public class ScenarioController {

    private final ScenarioService scenarioService;
    private final ScenarioReportService scenarioReportService;

    /** 情景列表（仅配偶可调） */
    @GetMapping("/list")
    public Result<List<Scenario>> list(@RequestParam("userId") Integer userId) {
        List<Scenario> list = scenarioService.listForSpouse(userId);
        return Result.success(list != null ? list : List.of());
    }

    /** 结束情景并生成报告（接受 JSON body，避免 FormData 被代理/绑定丢失） */
    @PostMapping("/end")
    public Result<ScenarioReport> end(@RequestBody ScenarioEndRequest req) {
        Integer userId = req != null ? req.getUserId() : null;
        Integer conversationId = req != null ? req.getConversationId() : null;
        String reason = req != null ? req.getReason() : null;
        log.info("[情景结束] 请求入参 userId={} conversationId={} reason={}", userId, conversationId, reason);
        if (userId == null || conversationId == null) {
            log.warn("[情景结束] 缺少 userId 或 conversationId");
            return Result.error(400, "BAD_REQUEST", "缺少必要参数");
        }
        try {
            log.info("[情景结束] 调用 service 前 userId={} conversationId={}", userId, conversationId);
            ScenarioReport report = scenarioReportService.endAndGenerateReport(userId, conversationId, reason);
            log.info("[情景结束] service 返回 reportNull={}", report == null);
            if (report == null) {
                log.warn("[情景结束] 返回 null，前端将收到 400 userId={} conversationId={}", userId, conversationId);
                return Result.error(400, "BAD_REQUEST", "无法结束该情景或生成报告");
            }
            log.info("[情景结束] 成功 reportId={} userId={}", report.getReportId(), userId);
            return Result.success(report);
        } catch (Throwable t) {
            log.error("[情景结束] 异常 userId={} conversationId={}", userId, conversationId, t);
            return Result.error(500, "INTERNAL_ERROR", "生成报告时出错，请稍后重试");
        }
    }

    /** 情景报告列表（仅配偶） */
    @GetMapping("/reports")
    public Result<List<ScenarioReport>> reports(@RequestParam("userId") Integer userId) {
        List<ScenarioReport> list = scenarioReportService.listBySpouseUserId(userId);
        return Result.success(list != null ? list : List.of());
    }

    /** 情景报告详情 */
    @GetMapping("/report/{reportId}")
    public Result<ScenarioReport> reportDetail(@RequestParam("userId") Integer userId,
                                               @PathVariable("reportId") Integer reportId) {
        ScenarioReport report = scenarioReportService.getByIdAndSpouse(reportId, userId);
        if (report == null) {
            return Result.error(404, "NOT_FOUND", "报告不存在或无权限");
        }
        return Result.success(report);
    }
}
