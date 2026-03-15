package com.anmory.yunji.utils;

import com.aliyun.oss.ClientException;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.OSSException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.util.UUID;

@Slf4j
public class AliOssUtil {

    private final String endpoint;
    private final String accessKeyId;
    private final String accessKeySecret;
    private final String bucketName;

    public AliOssUtil(String endpoint, String accessKeyId, String accessKeySecret, String bucketName) {
        this.endpoint = endpoint;
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
        this.bucketName = bucketName;
    }

    // ========== 新增：按业务类型生成ObjectKey ==========
    /**
     * 生成语音文件ObjectKey
     */
    private String generateVoiceObjectKey(Integer userId, String originalFilename) {
        String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
        String uniqueFileName = UUID.randomUUID().toString() + suffix;
        return "yunji/" + userId + "/voice/" + uniqueFileName;
    }

    /**
     * 生成普通文件ObjectKey（支持文档、视频等，无扩展名时用 .file）
     */
    private String generateFileObjectKey(Integer userId, String originalFilename) {
        String suffix = ".file";
        if (originalFilename != null && !originalFilename.isBlank()) {
            int lastDot = originalFilename.lastIndexOf(".");
            if (lastDot >= 0 && lastDot < originalFilename.length() - 1) {
                suffix = originalFilename.substring(lastDot);
            }
        }
        String uniqueFileName = UUID.randomUUID().toString() + suffix;
        return "yunji/" + userId + "/file/" + uniqueFileName;
    }

    /**
     * 生成照片ObjectKey
     */
    private String generatePhotoObjectKey(Integer userId, String originalFilename) {
        String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
        String uniqueFileName = UUID.randomUUID().toString() + suffix;
        return "yunji/" + userId + "/photo/" + uniqueFileName;
    }

    /**
     * 生成导出 PDF 的 ObjectKey（用于发邮件时提供下载链接，避免大附件导致连接重置）
     */
    private String generateExportPdfObjectKey(Integer userId) {
        String uniqueFileName = UUID.randomUUID() + ".pdf";
        return "yunji/" + userId + "/export/" + uniqueFileName;
    }

    /**
     * 上传导出 PDF 到 OSS，返回可访问的 URL（用于邮件中「点击下载」链接）
     */
    public String uploadExportPdf(Integer userId, byte[] pdfBytes) {
        try {
            String objectKey = generateExportPdfObjectKey(userId);
            return upload(pdfBytes, objectKey);
        } catch (Exception e) {
            log.error("导出 PDF 上传 OSS 失败", e);
            throw new RuntimeException("导出 PDF 上传失败");
        }
    }

    /**
     * 生成 AI 聊天图片 ObjectKey（用户上传图 / AI 生成图）
     */
    private String generateChatImageObjectKey(Integer userId, String suffix) {
        String safeSuffix = (suffix == null || suffix.isBlank()) ? ".png" : suffix;
        if (!safeSuffix.startsWith(".")) {
            safeSuffix = "." + safeSuffix;
        }
        String uniqueFileName = UUID.randomUUID() + safeSuffix;
        return "yunji/" + userId + "/chat/" + uniqueFileName;
    }

    // ========== 业务上传方法 ==========
    /**
     * 上传语音文件
     */
    public String uploadVoice(Integer userId, MultipartFile file) {
        try {
            String objectKey = generateVoiceObjectKey(userId, file.getOriginalFilename());
            byte[] bytes = file.getBytes();
            return upload(bytes, objectKey);
        } catch (Exception e) {
            log.error("语音文件上传失败", e);
            throw new RuntimeException("语音文件上传失败");
        }
    }

    /**
     * 上传普通文件（文档/视频等）
     */
    public String uploadFile(Integer userId, MultipartFile file) {
        try {
            String objectKey = generateFileObjectKey(userId, file.getOriginalFilename());
            byte[] bytes = file.getBytes();
            return upload(bytes, objectKey);
        } catch (Exception e) {
            log.error("普通文件上传失败", e);
            throw new RuntimeException("普通文件上传失败");
        }
    }

    /**
     * 上传照片
     */
    public String uploadPhoto(Integer userId, MultipartFile file) {
        try {
            String objectKey = generatePhotoObjectKey(userId, file.getOriginalFilename());
            byte[] bytes = file.getBytes();
            return upload(bytes, objectKey);
        } catch (Exception e) {
            log.error("照片上传失败", e);
            throw new RuntimeException("照片上传失败");
        }
    }

    /**
     * 上传聊天图片（来源为用户上传）
     */
    public String uploadChatImage(Integer userId, MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            String suffix = ".png";
            if (originalFilename != null && originalFilename.contains(".")) {
                suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String objectKey = generateChatImageObjectKey(userId, suffix);
            return upload(file.getBytes(), objectKey);
        } catch (Exception e) {
            log.error("聊天图片上传失败(用户图片)", e);
            throw new RuntimeException("聊天图片上传失败");
        }
    }

    /**
     * 上传聊天图片（来源为 AI 生成）
     */
    public String uploadChatImage(Integer userId, byte[] bytes, String extension) {
        try {
            String objectKey = generateChatImageObjectKey(userId, extension);
            return upload(bytes, objectKey);
        } catch (Exception e) {
            log.error("聊天图片上传失败(AI图片)", e);
            throw new RuntimeException("聊天图片上传失败");
        }
    }

    // ========== 原有方法保留（略作注释优化） ==========
    /**
     * 生成头像ObjectKey
     */
    private String generateAvatarObjectKey(Integer userId, String originalFilename) {
        String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
        String uniqueFileName = UUID.randomUUID().toString() + suffix;
        return "yunji/" + userId + "/avatar/" + uniqueFileName;
    }

    /**
     * 上传用户头像
     */
    public String uploadAvatar(Integer userId, MultipartFile file) {
        try {
            String objectKey = generateAvatarObjectKey(userId, file.getOriginalFilename());
            byte[] bytes = file.getBytes();
            return upload(bytes, objectKey);
        } catch (Exception e) {
            log.error("头像上传失败", e);
            throw new RuntimeException("头像上传失败");
        }
    }

    /**
     * 基础上传方法（核心逻辑）
     */
    public String upload(byte[] bytes, String objectName) {
        OSS ossClient = null;
        try {
            ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
            ossClient.putObject(bucketName, objectName, new ByteArrayInputStream(bytes));

            // 拼接访问URL
            StringBuilder url = new StringBuilder("https://");
            url.append(bucketName)
                    .append(".")
                    .append(endpoint.replace("https://", "")) // 修复endpoint带https导致URL错误的问题
                    .append("/")
                    .append(objectName);

            log.info("文件上传成功，OSS路径：{}，访问URL：{}", objectName, url);
            return url.toString();
        } catch (OSSException oe) {
            log.error("OSS服务端异常：{}", oe.getErrorMessage());
            throw new RuntimeException("OSS上传失败");
        } catch (ClientException ce) {
            log.error("OSS客户端异常：{}", ce.getMessage());
            throw new RuntimeException("OSS连接失败");
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }

    /**
     * 根据URL删除OSS文件（通用方法，支持所有类型）
     */
    public void deleteFile(String fileUrl) {
        OSS ossClient = null;
        try {
            String prefix = "https://" + bucketName + "." + endpoint.replace("https://", "") + "/";
            String objectName = fileUrl.substring(prefix.length());

            ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
            ossClient.deleteObject(bucketName, objectName);

            log.info("OSS文件删除成功，URL：{}，objectName：{}", fileUrl, objectName);
        } catch (OSSException oe) {
            log.error("OSS服务端删除异常：{}", oe.getErrorMessage());
            throw new RuntimeException("OSS文件删除失败");
        } catch (ClientException ce) {
            log.error("OSS客户端删除异常：{}", ce.getMessage());
            throw new RuntimeException("OSS连接失败，文件删除失败");
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }
}