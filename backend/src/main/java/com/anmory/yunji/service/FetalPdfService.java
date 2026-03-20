package com.anmory.yunji.service;

import com.anmory.yunji.entity.FetalUltrasoundRecord;
import org.springframework.web.multipart.MultipartFile;

/**
 * B超 PDF 解析服务
 */
public interface FetalPdfService {

    /**
     * 仅解析 B超 PDF，不写入数据库。解析结果填入表单，由用户核对后手动保存。
     *
     * @param userId 用户ID（用于推算孕周等）
     * @param file   PDF 文件
     * @return 解析后的 B超数据（recordDate, gestationWeek, bpdMm 等），解析失败返回 null
     */
    FetalUltrasoundRecord parseOnly(Integer userId, MultipartFile file);
}
