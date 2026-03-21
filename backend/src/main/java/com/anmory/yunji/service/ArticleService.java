package com.anmory.yunji.service;

import com.anmory.yunji.entity.Article;
import java.util.List;

public interface ArticleService {
    Article getById(Integer articleId);
    List<Article> listPublished();
    /** 根据用户身份返回可见的已发布文章（孕妇/配偶/其他） */
    List<Article> listPublishedForUser(Integer userId);
    List<Article> listAll();
    Article create(Article article);
    Article update(Article article);
    boolean delete(Integer articleId);
}
