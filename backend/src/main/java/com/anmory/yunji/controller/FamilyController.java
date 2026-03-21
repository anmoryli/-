package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.Family;
import com.anmory.yunji.exception.BusinessException;
import com.anmory.yunji.service.FamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/family")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping("/create")
    public Result<Map<String, Object>> createFamily(@RequestParam("userId") Integer userId) {
        Map<String, Object> data = familyService.createFamily(userId);
        return Result.success(data);
    }

    @PostMapping("/join")
    public Result<Family> joinFamily(@RequestParam("userId") Integer userId,
                                     @RequestParam("inviteCode") String inviteCode,
                                     @RequestParam(value = "relationship", required = false) String relationship) {
        try {
            Family family = familyService.joinByInviteCode(userId, inviteCode, relationship);
            if (family == null) {
                return Result.error("邀请码无效或已过期");
            }
            return Result.success(family);
        } catch (BusinessException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/leave")
    public Result<Void> leaveFamily(@RequestParam("userId") Integer userId) {
        try {
            familyService.leaveFamily(userId);
            return Result.success();
        } catch (BusinessException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/dissolve")
    public Result<Void> dissolveFamily(@RequestParam("userId") Integer userId) {
        try {
            familyService.dissolveFamily(userId);
            return Result.success();
        } catch (BusinessException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/my")
    public Result<Family> getMyFamily(@RequestParam("userId") Integer userId) {
        Family family = familyService.getMyFamily(userId);
        return Result.success(family);
    }

    @GetMapping("/members")
    public Result<List<Map<String, Object>>> getMembers(@RequestParam("familyId") Integer familyId,
                                                        @RequestParam("userId") Integer userId) {
        List<Map<String, Object>> members = familyService.getFamilyMembers(familyId, userId);
        return Result.success(members);
    }

    @PutMapping("/members/relationship")
    public Result<Void> updateMemberRelationship(@RequestParam("familyId") Integer familyId,
                                                 @RequestParam("memberId") Integer memberId,
                                                 @RequestParam("relationship") String relationship,
                                                 @RequestParam("userId") Integer userId) {
        try {
            familyService.updateMemberRelationship(familyId, memberId, relationship, userId);
            return Result.success();
        } catch (BusinessException e) {
            return Result.error(e.getMessage());
        }
    }

    /** 家庭成员查看孕妇的怀孕进度：返回创建者的孕期信息与记录数，供「我的」页展示 */
    @GetMapping("/creator-pregnancy")
    public Result<Map<String, Object>> getCreatorPregnancy(@RequestParam("userId") Integer userId) {
        Map<String, Object> info = familyService.getCreatorPregnancyInfo(userId);
        return Result.success(info != null ? info : java.util.Collections.emptyMap());
    }
}
