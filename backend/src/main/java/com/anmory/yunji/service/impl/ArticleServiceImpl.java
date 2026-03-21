package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Article;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.mapper.ArticleMapper;
import com.anmory.yunji.service.ArticleService;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    private ArticleMapper articleMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private FamilyService familyService;

    @Override
    public Article getById(Integer articleId) {
        return articleMapper.findById(articleId);
    }

    @Override
    public List<Article> listPublished() {
        return articleMapper.listPublished();
    }

    @Override
    public List<Article> listPublishedForUser(Integer userId) {
        if (userId == null) {
            return articleMapper.listPublished();
        }
        User user = userService.getById(userId);
        if (user == null) {
            return articleMapper.listPublishedByAudience(List.of("all"));
        }
        String userType = user.getUserType();
        if (userType == null) userType = "pregnant";
        if ("pregnant".equals(userType)) {
            return articleMapper.listPublishedByAudience(List.of("all", "pregnant"));
        }
        if ("family_member".equals(userType) && familyService.isSpouse(userId)) {
            return articleMapper.listPublishedByAudience(List.of("all", "spouse"));
        }
        return articleMapper.listPublishedByAudience(List.of("all"));
    }

    @Override
    public List<Article> listAll() {
        return articleMapper.listAll();
    }

    @Override
    public Article create(Article article) {
        if (article.getSortOrder() == null) article.setSortOrder(0);
        if (article.getIsPublished() == null) article.setIsPublished(true);
        articleMapper.insert(article);
        return article;
    }

    @Override
    public Article update(Article article) {
        articleMapper.update(article);
        return articleMapper.findById(article.getArticleId());
    }

    @Override
    public boolean delete(Integer articleId) {
        return articleMapper.deleteById(articleId) > 0;
    }
}
