package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.FamilyMember;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.exception.BusinessException;
import com.anmory.yunji.mapper.FamilyMapper;
import com.anmory.yunji.mapper.FamilyMemberMapper;
import com.anmory.yunji.mapper.MemoMapper;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.SpouseDetectionService;
import com.anmory.yunji.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyServiceImpl implements FamilyService {

    private final FamilyMapper familyMapper;
    private final FamilyMemberMapper familyMemberMapper;
    private final MemoMapper memoMapper;
    private final UserService userService;
    private final SpouseDetectionService spouseDetectionService;

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final int EXPIRE_DAYS = 7;
    private static final Set<String> SPOUSE_KEYWORDS = Set.of("配偶", "老公", "丈夫", "妻子", "老婆");

    /** 校验自定义关系不能为配偶类（选择「其他」时自定义输入的限制） */
    private void validateRelationshipNotSpouse(String relationship) {
        if (relationship == null || relationship.isBlank()) return;
        String r = relationship.trim();
        if (SPOUSE_KEYWORDS.contains(r)) {
            throw new BusinessException("自定义关系不能为配偶类（配偶、老公、丈夫等），请从上方选择");
        }
    }

    private FamilyMember getPrimaryMembership(Integer userId) {
        List<FamilyMember> memberships = familyMemberMapper.findByUserId(userId);
        if (memberships.isEmpty()) {
            return null;
        }
        return memberships.get(0);
    }

    private String generateInviteCode() {
        Random r = new Random();
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARS.charAt(r.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> createFamily(Integer userId) {
        FamilyMember existing = getPrimaryMembership(userId);
        if (existing != null) {
            Family f = familyMapper.selectById(existing.getFamilyId());
            if (f != null) {
                Map<String, Object> out = new HashMap<>();
                out.put("familyId", f.getFamilyId());
                out.put("inviteCode", f.getInviteCode());
                out.put("expiresAt", f.getInviteExpiresAt());
                return out;
            }
        }
        Family family = new Family();
        family.setCreatorUserId(userId);
        family.setInviteCode(generateInviteCode());
        family.setInviteExpiresAt(LocalDateTime.now().plusDays(EXPIRE_DAYS));
        familyMapper.insert(family);

        FamilyMember creator = new FamilyMember();
        creator.setFamilyId(family.getFamilyId());
        creator.setUserId(userId);
        creator.setRole("creator");
        familyMemberMapper.insert(creator);

        Map<String, Object> out = new HashMap<>();
        out.put("familyId", family.getFamilyId());
        out.put("inviteCode", family.getInviteCode());
        out.put("expiresAt", family.getInviteExpiresAt());
        return out;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Family joinByInviteCode(Integer userId, String inviteCode, String relationship) {
        if (inviteCode == null || inviteCode.trim().isEmpty()) return null;
        List<FamilyMember> userFamilies = familyMemberMapper.findByUserId(userId);
        if (!userFamilies.isEmpty()) {
            throw new BusinessException("您已在家庭中，请先退出后再加入");
        }
        String code = inviteCode.trim().toUpperCase();
        Family family = familyMapper.findByInviteCode(code);
        if (family == null) return null;
        if (family.getInviteExpiresAt().isBefore(LocalDateTime.now())) return null;
        FamilyMember existing = familyMemberMapper.findByFamilyAndUser(family.getFamilyId(), userId);
        if (existing != null) return family;
        FamilyMember member = new FamilyMember();
        member.setFamilyId(family.getFamilyId());
        member.setUserId(userId);
        member.setRole("member");
        member.setRelationship(relationship != null && !relationship.isBlank() ? relationship.trim() : null);
        member.setIsSpouse(false);
        familyMemberMapper.insert(member);
        applySpouseUniqueness(family.getFamilyId(), member.getMemberId(), member.getRelationship());
        if (!isSpouseKeyword(member.getRelationship())) {
            spouseDetectionService.detectSpouseAsync(member.getMemberId(), member.getRelationship());
        }
        return family;
    }

    @Override
    public Family getMyFamily(Integer userId) {
        FamilyMember membership = getPrimaryMembership(userId);
        if (membership == null) return null;
        return familyMapper.selectById(membership.getFamilyId());
    }

    @Override
    public Map<String, Object> getCreatorPregnancyInfo(Integer memberUserId) {
        Family family = getMyFamily(memberUserId);
        if (family == null || family.getCreatorUserId() == null) return null;
        Integer creatorId = family.getCreatorUserId();
        User creator = userService.getById(creatorId);
        if (creator == null) return null;
        Map<String, Object> out = new HashMap<>();
        out.put("creatorUserId", creatorId);
        out.put("creatorUsername", creator.getUsername());
        out.put("lastMenstrualDate", creator.getLastMenstrualDate() != null ? creator.getLastMenstrualDate().toString() : null);
        out.put("pregnancyTime", creator.getPregnancyTime() != null ? creator.getPregnancyTime().toString() : null);
        out.put("recordCount", memoMapper.countByUserId(creatorId));
        return out;
    }

    @Override
    public List<Map<String, Object>> getFamilyMembers(Integer familyId, Integer requestUserId) {
        if (!isFamilyMember(requestUserId, familyId)) return List.of();
        List<FamilyMember> members = familyMemberMapper.findByFamilyId(familyId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (FamilyMember m : members) {
            User u = userService.getById(m.getUserId());
            Map<String, Object> row = new HashMap<>();
            row.put("memberId", m.getMemberId());
            row.put("userId", m.getUserId());
            row.put("username", u != null ? u.getUsername() : "");
            row.put("role", m.getRole());
            row.put("relationship", m.getRelationship());
            row.put("isSpouse", m.getIsSpouse());
            row.put("joinedAt", m.getJoinedAt());
            result.add(row);
        }
        return result;
    }

    @Override
    public boolean isFamilyMember(Integer userId, Integer familyId) {
        return familyMemberMapper.findByFamilyAndUser(familyId, userId) != null;
    }

    @Override
    public boolean canViewRecord(Integer recordOwnerId, Integer requestUserId) {
        if (recordOwnerId.equals(requestUserId)) return true;
        List<FamilyMember> ownerMembers = familyMemberMapper.findByUserId(recordOwnerId);
        List<FamilyMember> requestMembers = familyMemberMapper.findByUserId(requestUserId);
        Set<Integer> ownerFamilies = new HashSet<>();
        for (FamilyMember m : ownerMembers) ownerFamilies.add(m.getFamilyId());
        for (FamilyMember m : requestMembers) {
            if (ownerFamilies.contains(m.getFamilyId())) return true;
        }
        return false;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void leaveFamily(Integer userId) {
        FamilyMember membership = getPrimaryMembership(userId);
        if (membership == null) {
            throw new BusinessException("您未加入任何家庭");
        }
        if ("creator".equals(membership.getRole())) {
            throw new BusinessException("创建者不能直接退出，请转让家庭或解散");
        }
        familyMemberMapper.deleteByFamilyAndUser(membership.getFamilyId(), userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void dissolveFamily(Integer userId) {
        FamilyMember membership = getPrimaryMembership(userId);
        if (membership == null) {
            throw new BusinessException("您未加入任何家庭");
        }
        if (!"creator".equals(membership.getRole())) {
            throw new BusinessException("仅创建者可以解散家庭");
        }
        familyMapper.deleteById(membership.getFamilyId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateMemberRelationship(Integer familyId, Integer memberId, String relationship, Integer requestUserId) {
        FamilyMember membership = getPrimaryMembership(requestUserId);
        if (membership == null || !membership.getFamilyId().equals(familyId)) {
            throw new BusinessException("非该家庭成员");
        }
        if (!"creator".equals(membership.getRole())) {
            throw new BusinessException("仅创建者可以编辑成员关系");
        }
        FamilyMember target = familyMemberMapper.findByFamilyId(familyId).stream()
                .filter(m -> m.getMemberId().equals(memberId))
                .findFirst()
                .orElse(null);
        if (target == null) {
            throw new BusinessException("成员不存在");
        }
        String newRelationship = relationship != null && !relationship.isBlank() ? relationship.trim() : null;
        familyMemberMapper.updateRelationship(memberId, newRelationship);
        applySpouseUniqueness(familyId, memberId, newRelationship);
        if (!isSpouseKeyword(newRelationship)) {
            spouseDetectionService.detectSpouseAsync(memberId, newRelationship);
        }
    }

    /** 若关系为配偶关键词，则保证该家庭仅此成员为配偶；否则不修改 is_spouse */
    private void applySpouseUniqueness(Integer familyId, Integer memberId, String relationship) {
        if (familyId == null || memberId == null || !isSpouseKeyword(relationship)) return;
        List<FamilyMember> members = familyMemberMapper.findByFamilyId(familyId);
        for (FamilyMember m : members) {
            if (m.getMemberId().equals(memberId)) {
                familyMemberMapper.updateIsSpouse(memberId, true);
            } else {
                if (Boolean.TRUE.equals(m.getIsSpouse())) {
                    familyMemberMapper.updateIsSpouse(m.getMemberId(), false);
                }
            }
        }
    }

    private boolean isSpouseKeyword(String relationship) {
        if (relationship == null || relationship.isBlank()) return false;
        return SPOUSE_KEYWORDS.contains(relationship.trim());
    }

    @Override
    public List<Integer> getSpouseUserIds(Integer recordOwnerId) {
        FamilyMember membership = getPrimaryMembership(recordOwnerId);
        if (membership == null) return List.of();
        List<FamilyMember> members = familyMemberMapper.findByFamilyId(membership.getFamilyId());
        List<Integer> spouseIds = new ArrayList<>();
        for (FamilyMember m : members) {
            if (Boolean.TRUE.equals(m.getIsSpouse()) && !m.getUserId().equals(recordOwnerId)) {
                spouseIds.add(m.getUserId());
            }
        }
        return spouseIds;
    }

    @Override
    public boolean isSpouse(Integer userId) {
        return familyMemberMapper.findSpouseByUserId(userId) != null;
    }
}