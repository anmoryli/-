package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.FamilyMember;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FamilyMemberMapper {

    @Insert("INSERT INTO family_member (family_id, user_id, role, relationship, is_spouse, joined_at) " +
            "VALUES (#{familyId}, #{userId}, #{role}, #{relationship}, #{isSpouse}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "memberId")
    int insert(FamilyMember member);

    @Select("SELECT * FROM family_member WHERE family_id = #{familyId} AND user_id = #{userId}")
    FamilyMember findByFamilyAndUser(@Param("familyId") Integer familyId, @Param("userId") Integer userId);

    @Select("SELECT * FROM family_member WHERE user_id = #{userId} ORDER BY joined_at DESC, member_id DESC")
    List<FamilyMember> findByUserId(@Param("userId") Integer userId);

    @Select("SELECT * FROM family_member WHERE family_id = #{familyId} " +
            "ORDER BY CASE WHEN role='creator' THEN 0 ELSE 1 END, joined_at ASC, member_id ASC")
    List<FamilyMember> findByFamilyId(@Param("familyId") Integer familyId);

    @Select("SELECT fm.* FROM family_member fm WHERE fm.user_id = #{userId}")
    List<FamilyMember> selectByUserId(@Param("userId") Integer userId);

    @Select("SELECT * FROM family_member WHERE user_id = #{userId} AND is_spouse = 1 LIMIT 1")
    FamilyMember findSpouseByUserId(@Param("userId") Integer userId);

    @Delete("DELETE FROM family_member WHERE family_id = #{familyId} AND user_id = #{userId}")
    int deleteByFamilyAndUser(@Param("familyId") Integer familyId, @Param("userId") Integer userId);

    @Delete("DELETE FROM family_member WHERE family_id = #{familyId}")
    int deleteByFamilyId(@Param("familyId") Integer familyId);

    @Update("UPDATE family_member SET is_spouse = #{isSpouse} WHERE member_id = #{memberId}")
    int updateIsSpouse(@Param("memberId") Integer memberId, @Param("isSpouse") Boolean isSpouse);

    @Update("UPDATE family_member SET relationship = #{relationship} WHERE member_id = #{memberId}")
    int updateRelationship(@Param("memberId") Integer memberId, @Param("relationship") String relationship);
}
