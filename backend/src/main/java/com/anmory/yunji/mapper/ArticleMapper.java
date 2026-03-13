package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Article;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ArticleMapper {

    @Select("SELECT * FROM article WHERE article_id = #{articleId}")
    Article findById(@Param("articleId") Integer articleId);

    @Select("SELECT * FROM article WHERE is_published = 1 ORDER BY sort_order ASC, article_id DESC")
    List<Article> listPublished();

    @Select("<script>SELECT * FROM article WHERE is_published = 1 " +
            "AND (audience IS NULL OR audience = '' OR audience IN " +
            "<foreach collection='audiences' item='a' open='(' separator=',' close=')'>#{a}</foreach>) " +
            "ORDER BY sort_order ASC, article_id DESC</script>")
    List<Article> listPublishedByAudience(@Param("audiences") java.util.List<String> audiences);

    @Select("SELECT * FROM article ORDER BY sort_order ASC, article_id DESC")
    List<Article> listAll();

    @Insert("INSERT INTO article (title, summary, content, cover_url, category, sort_order, is_published, audience, created_at, updated_at) " +
            "VALUES (#{title}, #{summary}, #{content}, #{coverUrl}, #{category}, #{sortOrder}, #{isPublished}, #{audience}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "articleId")
    int insert(Article article);

    @Update("UPDATE article SET title=#{title}, summary=#{summary}, content=#{content}, cover_url=#{coverUrl}, " +
            "category=#{category}, sort_order=#{sortOrder}, is_published=#{isPublished}, audience=#{audience}, updated_at=NOW() WHERE article_id=#{articleId}")
    int update(Article article);

    @Delete("DELETE FROM article WHERE article_id = #{articleId}")
    int deleteById(@Param("articleId") Integer articleId);
}
