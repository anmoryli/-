package com.anmory.yunji.service;

import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.FamilyMember;

import java.util.List;
import java.util.Map;

/**
 * 家庭服务
 */
public interface FamilyService {

    /**
     * 创建家庭，返回邀请码
     */
    Map<String, Object> createFamily(Integer userId);

    /**
     * 通过邀请码加入家庭
     *
     * @param relationship 与孕妇关系，如老公、婆婆、妈妈等，可为空
     */
    Family joinByInviteCode(Integer userId, String inviteCode, String relationship);

    /**
     * 获取用户所属的家庭（如有）
     */
    Family getMyFamily(Integer userId);

    /**
     * 获取家庭成员列表
     */
    List<Map<String, Object>> getFamilyMembers(Integer familyId, Integer requestUserId);

    /**
     * 用户是否为某家庭的成员
     */
    boolean isFamilyMember(Integer userId, Integer familyId);

    /**
     * 记录所属用户与请求用户是否为同一家庭成员（可互见记录）
     */
    boolean canViewRecord(Integer recordOwnerId, Integer requestUserId);

    /**
     * 获取记录所属用户家庭中配偶的 userId 列表（用于可见范围校验：配偶必须包含在 visibleTo 中）
     */
    java.util.List<Integer> getSpouseUserIds(Integer recordOwnerId);

    /**
     * 退出家庭（仅家庭成员可退出，创建者不可退出）
     */
    void leaveFamily(Integer userId);

    /**
     * 解散家庭（仅创建者可操作）
     */
    void dissolveFamily(Integer userId);

    /**
     * 更新家庭成员关系（仅创建者可操作）
     */
    void updateMemberRelationship(Integer familyId, Integer memberId, String relationship, Integer requestUserId);

    /**
     * 用户是否为某家庭的配偶（is_spouse=1）
     */
    boolean isSpouse(Integer userId);
}
