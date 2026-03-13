package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Family;
import org.apache.ibatis.annotations.*;

@Mapper
public interface FamilyMapper {

    @Insert("INSERT INTO family (creator_user_id, invite_code, invite_expires_at, created_at, updated_at) " +
            "VALUES (#{creatorUserId}, #{inviteCode}, #{inviteExpiresAt}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "familyId")
    int insert(Family family);

    @Select("SELECT * FROM family WHERE family_id = #{familyId}")
    Family selectById(@Param("familyId") Integer familyId);

    @Select("SELECT * FROM family WHERE invite_code = #{inviteCode}")
    Family findByInviteCode(@Param("inviteCode") String inviteCode);

    @Update("UPDATE family SET invite_code = #{inviteCode}, invite_expires_at = #{inviteExpiresAt}, updated_at = NOW() " +
            "WHERE family_id = #{familyId}")
    int updateInviteCode(@Param("familyId") Integer familyId, @Param("inviteCode") String inviteCode, @Param("inviteExpiresAt") java.time.LocalDateTime inviteExpiresAt);

    @Delete("DELETE FROM family WHERE family_id = #{familyId}")
    int deleteById(@Param("familyId") Integer familyId);
}
