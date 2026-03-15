package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Memo;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface MemoMapper {

    /**
     * 新增备忘录主记录
     */
    @Insert("INSERT INTO yunfu.memo (user_id, type, photo_title, photo_description, pregnancy_week, pregnancy_week_index, record_weight_kg, tag, mood, visibility_mode, visible_to, category) " +
            "VALUES (#{userId}, #{type}, #{photoTitle}, #{photoDescription}, #{pregnancyWeek}, #{pregnancyWeekIndex}, #{recordWeightKg}, #{tag}, #{mood}, #{visibilityMode}, #{visibleTo}, #{category})")
    @Options(useGeneratedKeys = true, keyProperty = "memoId") // 自增主键回填
    void insert(Memo memo);

    /** 无 photo_title，含 visibility_mode/visible_to（DB 有可见范围列但无 photo_title 时用于创建时保存可见范围） */
    @Insert("INSERT INTO yunfu.memo (user_id, type, photo_description, pregnancy_week, pregnancy_week_index, record_weight_kg, tag, mood, visibility_mode, visible_to, category) " +
            "VALUES (#{userId}, #{type}, #{photoDescription}, #{pregnancyWeek}, #{pregnancyWeekIndex}, #{recordWeightKg}, #{tag}, #{mood}, #{visibilityMode}, #{visibleTo}, #{category})")
    @Options(useGeneratedKeys = true, keyProperty = "memoId")
    void insertWithVisibility(Memo memo);

    @Insert("INSERT INTO yunfu.memo (user_id, type, photo_description, pregnancy_week, tag) " +
            "VALUES (#{userId}, #{type}, #{photoDescription}, #{pregnancyWeek}, #{tag})")
    @Options(useGeneratedKeys = true, keyProperty = "memoId")
    void insertLegacy(Memo memo);

    /**
     * 根据ID查询备忘录主记录
     */
    @Select("SELECT memo_id, user_id, type, photo_title, photo_description, pregnancy_week, pregnancy_week_index, record_weight_kg, tag, mood, visibility_mode, visible_to, category, created_at, updated_at " +
            "FROM yunfu.memo WHERE memo_id = #{memoId}")
    @Results({
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "type", property = "type"),
            @Result(column = "photo_title", property = "photoTitle"),
            @Result(column = "photo_description", property = "photoDescription"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "pregnancy_week_index", property = "pregnancyWeekIndex"),
            @Result(column = "record_weight_kg", property = "recordWeightKg"),
            @Result(column = "tag", property = "tag"),
            @Result(column = "mood", property = "mood"),
            @Result(column = "visibility_mode", property = "visibilityMode"),
            @Result(column = "visible_to", property = "visibleTo"),
            @Result(column = "category", property = "category"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    Memo selectById(Integer memoId);

    @Select("SELECT memo_id, user_id, type, photo_description, pregnancy_week, tag, created_at, updated_at " +
            "FROM yunfu.memo WHERE memo_id = #{memoId}")
    @Results({
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "type", property = "type"),
            @Result(column = "photo_description", property = "photoDescription"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "tag", property = "tag"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    Memo selectByIdLegacy(Integer memoId);

    /**
     * 根据ID删除备忘录主记录
     */
    @Delete("DELETE FROM memo WHERE memo_id = #{memoId}")
    int deleteById(Integer memoId);

    @Update("UPDATE yunfu.memo SET photo_title = #{photoTitle}, photo_description = #{photoDescription}, " +
            "pregnancy_week = #{pregnancyWeek}, pregnancy_week_index = #{pregnancyWeekIndex}, " +
            "record_weight_kg = #{recordWeightKg}, tag = #{tag}, mood = #{mood}, visibility_mode = #{visibilityMode}, visible_to = #{visibleTo}, category = #{category}, updated_at = NOW() " +
            "WHERE memo_id = #{memoId}")
    int updateById(Memo memo);

    @Update("UPDATE yunfu.memo SET category = #{category}, updated_at = NOW() WHERE memo_id = #{memoId}")
    int updateCategory(@Param("memoId") Integer memoId, @Param("category") String category);

    @Update("UPDATE yunfu.memo SET mood = #{mood}, updated_at = NOW() WHERE memo_id = #{memoId}")
    int updateMood(@Param("memoId") Integer memoId, @Param("mood") String mood);

    @Update("UPDATE yunfu.memo SET visibility_mode = #{visibilityMode}, visible_to = #{visibleTo}, updated_at = NOW() WHERE memo_id = #{memoId}")
    int updateVisibility(@Param("memoId") Integer memoId, @Param("visibilityMode") String visibilityMode, @Param("visibleTo") String visibleTo);

    /**
     * 根据用户ID查询所有备忘录主记录（用于整合异构数据）
     */
    @Select("SELECT memo_id, user_id, type, photo_title, photo_description, pregnancy_week, pregnancy_week_index, record_weight_kg, tag, mood, visibility_mode, visible_to, category, created_at, updated_at " +
            "FROM yunfu.memo WHERE user_id = #{userId} " +
            "ORDER BY CASE WHEN pregnancy_week_index IS NULL THEN 1 ELSE 0 END, pregnancy_week_index ASC, created_at ASC")
    @Results({
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "type", property = "type"),
            @Result(column = "photo_title", property = "photoTitle"),
            @Result(column = "photo_description", property = "photoDescription"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "pregnancy_week_index", property = "pregnancyWeekIndex"),
            @Result(column = "record_weight_kg", property = "recordWeightKg"),
            @Result(column = "tag", property = "tag"),
            @Result(column = "mood", property = "mood"),
            @Result(column = "visibility_mode", property = "visibilityMode"),
            @Result(column = "visible_to", property = "visibleTo"),
            @Result(column = "category", property = "category"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Memo> selectAllByUserId(Integer userId);

    @Select("SELECT memo_id, user_id, type, photo_description, pregnancy_week, tag, created_at, updated_at " +
            "FROM yunfu.memo WHERE user_id = #{userId} ORDER BY created_at ASC")
    @Results({
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "type", property = "type"),
            @Result(column = "photo_description", property = "photoDescription"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "tag", property = "tag"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Memo> selectAllByUserIdLegacy(Integer userId);

    @Select("SELECT memo_id, user_id, type, photo_title, photo_description, pregnancy_week, pregnancy_week_index, record_weight_kg, tag, mood, visibility_mode, visible_to, category, created_at, updated_at " +
            "FROM yunfu.memo WHERE user_id = #{userId} " +
            "ORDER BY CASE WHEN pregnancy_week_index IS NULL THEN 1 ELSE 0 END, pregnancy_week_index ASC, created_at ASC " +
            "LIMIT #{limit} OFFSET #{offset}")
    @Results({
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "type", property = "type"),
            @Result(column = "photo_title", property = "photoTitle"),
            @Result(column = "photo_description", property = "photoDescription"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "pregnancy_week_index", property = "pregnancyWeekIndex"),
            @Result(column = "record_weight_kg", property = "recordWeightKg"),
            @Result(column = "tag", property = "tag"),
            @Result(column = "mood", property = "mood"),
            @Result(column = "visibility_mode", property = "visibilityMode"),
            @Result(column = "visible_to", property = "visibleTo"),
            @Result(column = "category", property = "category"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Memo> selectAllByUserIdPaged(@Param("userId") Integer userId, @Param("limit") int limit, @Param("offset") int offset);

    @Select("SELECT memo_id, user_id, type, photo_description, pregnancy_week, tag, created_at, updated_at " +
            "FROM yunfu.memo WHERE user_id = #{userId} ORDER BY created_at ASC " +
            "LIMIT #{limit} OFFSET #{offset}")
    @Results({
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "type", property = "type"),
            @Result(column = "photo_description", property = "photoDescription"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "tag", property = "tag"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Memo> selectAllByUserIdPagedLegacy(@Param("userId") Integer userId, @Param("limit") int limit, @Param("offset") int offset);

    /** 分页查询：含 visibility_mode/visible_to，不含 photo_title（DB 无 photo_title 但有可见范围列时用于正确过滤） */
    @Select("SELECT memo_id, user_id, type, photo_description, pregnancy_week, pregnancy_week_index, record_weight_kg, tag, mood, visibility_mode, visible_to, category, created_at, updated_at " +
            "FROM yunfu.memo WHERE user_id = #{userId} " +
            "ORDER BY CASE WHEN pregnancy_week_index IS NULL THEN 1 ELSE 0 END, pregnancy_week_index ASC, created_at ASC " +
            "LIMIT #{limit} OFFSET #{offset}")
    @Results({
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "type", property = "type"),
            @Result(column = "photo_description", property = "photoDescription"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "pregnancy_week_index", property = "pregnancyWeekIndex"),
            @Result(column = "record_weight_kg", property = "recordWeightKg"),
            @Result(column = "tag", property = "tag"),
            @Result(column = "mood", property = "mood"),
            @Result(column = "visibility_mode", property = "visibilityMode"),
            @Result(column = "visible_to", property = "visibleTo"),
            @Result(column = "category", property = "category"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Memo> selectAllByUserIdPagedWithVisibility(@Param("userId") Integer userId, @Param("limit") int limit, @Param("offset") int offset);

    default List<Memo> selectAllByUserIdPagedCompat(Integer userId, int limit, int offset) {
        try {
            return selectAllByUserIdPaged(userId, limit, offset);
        } catch (RuntimeException ex) {
            if (isMissingPhotoTitleColumn(ex)) {
                try {
                    return selectAllByUserIdPagedWithVisibility(userId, limit, offset);
                } catch (RuntimeException ex2) {
                    if (isMissingPhotoTitleColumn(ex2) || isMissingColumn(ex2, "visibility_mode", "visible_to")) {
                        return selectAllByUserIdPagedLegacy(userId, limit, offset);
                    }
                    throw ex2;
                }
            }
            throw ex;
        }
    }

    private boolean isMissingColumn(Throwable ex, String... colNames) {
        Throwable cur = ex;
        while (cur != null) {
            String msg = cur.getMessage();
            if (msg != null) {
                for (String c : colNames) {
                    if (msg.contains("Unknown column '" + c + "'")) return true;
                }
            }
            cur = cur.getCause();
        }
        return false;
    }

    default void insertCompat(Memo memo) {
        try {
            insert(memo);
        } catch (RuntimeException ex) {
            if (isMissingPhotoTitleColumn(ex)) {
                try {
                    insertWithVisibility(memo);
                } catch (RuntimeException ex2) {
                    if (isMissingColumn(ex2, "visibility_mode", "visible_to")) {
                        insertLegacy(memo);
                    } else {
                        throw ex2;
                    }
                }
                return;
            }
            throw ex;
        }
    }

    default Memo selectByIdCompat(Integer memoId) {
        try {
            return selectById(memoId);
        } catch (RuntimeException ex) {
            if (isMissingPhotoTitleColumn(ex)) {
                return selectByIdLegacy(memoId);
            }
            throw ex;
        }
    }

    default List<Memo> selectAllByUserIdCompat(Integer userId) {
        try {
            return selectAllByUserId(userId);
        } catch (RuntimeException ex) {
            if (isMissingPhotoTitleColumn(ex)) {
                return selectAllByUserIdLegacy(userId);
            }
            throw ex;
        }
    }

    private boolean isMissingPhotoTitleColumn(Throwable ex) {
        Throwable cur = ex;
        while (cur != null) {
            String msg = cur.getMessage();
            if (msg != null && (msg.contains("Unknown column 'photo_title'")
                    || msg.contains("Unknown column 'pregnancy_week_index'")
                    || msg.contains("Unknown column 'record_weight_kg'"))) {
                return true;
            }
            cur = cur.getCause();
        }
        return false;
    }

    @Select("SELECT COUNT(*) FROM yunfu.memo WHERE user_id = #{userId} AND DATE(created_at) = #{date}")
    int countByUserAndDate(@Param("userId") Integer userId, @Param("date") java.time.LocalDate date);

    @Select("SELECT COUNT(*) FROM yunfu.memo WHERE user_id = #{userId} AND tag = #{tag}")
    int countByUserAndTag(@Param("userId") Integer userId, @Param("tag") String tag);

    @Select("SELECT COUNT(*) FROM yunfu.memo WHERE user_id = #{userId} AND (pregnancy_week LIKE '%20%' OR pregnancy_week LIKE '%二十%')")
    int countByUserAndWeek20(@Param("userId") Integer userId);

    @Select("SELECT DISTINCT DATE(created_at) FROM yunfu.memo WHERE user_id = #{userId} AND created_at >= #{from} ORDER BY DATE(created_at) DESC")
    List<LocalDate> selectDistinctRecordDates(@Param("userId") Integer userId, @Param("from") LocalDate from);

    @Select("SELECT COUNT(*) FROM yunfu.memo WHERE user_id = #{userId} AND DATE(created_at) >= #{from} AND DATE(created_at) <= #{to}")
    int countByUserAndDateRange(@Param("userId") Integer userId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Select("SELECT COUNT(*) FROM yunfu.memo WHERE user_id = #{userId}")
    int countByUserId(@Param("userId") Integer userId);
}