package com.anmory.yunji.service.impl;

import com.anmory.yunji.pdf.LayoutPreservingTextStripper;
import com.anmory.yunji.service.PdfExtractionService;
import com.anmory.yunji.utils.AliOssUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.graphics.form.PDFormXObject;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfExtractionServiceImpl implements PdfExtractionService {

    private static final int MIN_TEXT_LENGTH = 50;
    private final AliOssUtil aliOssUtil;

    @Override
    public String extractWithStructure(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) return "";
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            LayoutPreservingTextStripper stripper = new LayoutPreservingTextStripper();
            String result = stripper.getText(doc);
            if (result != null && !result.isBlank()) {
                return result;
            }
            // 布局保留失败时回退到纯文本
            return fallbackPlainText(doc);
        } catch (Exception e) {
            log.warn("PDF 布局保留抽取失败，尝试纯文本", e);
            return fallbackPlainText(pdfBytes);
        }
    }

    private String fallbackPlainText(PDDocument doc) {
        try {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (Exception e) {
            log.warn("PDF 纯文本抽取失败", e);
            return "";
        }
    }

    private String fallbackPlainText(byte[] pdfBytes) {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            return fallbackPlainText(doc);
        } catch (Exception e) {
            log.warn("PDF 纯文本抽取失败", e);
            return "";
        }
    }

    @Override
    public List<ExtractedImage> extractImages(byte[] pdfBytes) {
        List<ExtractedImage> result = new ArrayList<>();
        if (pdfBytes == null || pdfBytes.length == 0) return result;
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            int pageIndex = 0;
            for (PDPage page : doc.getPages()) {
                List<ExtractedImage> pageImages = extractImagesFromResources(page.getResources(), pageIndex);
                result.addAll(pageImages);
                pageIndex++;
            }
        } catch (Exception e) {
            log.warn("PDF 图片提取失败", e);
        }
        return result;
    }

    private List<ExtractedImage> extractImagesFromResources(PDResources resources, int pageIndex) {
        return extractImagesFromResourcesRecursive(resources, pageIndex, 0);
    }

    private List<ExtractedImage> extractImagesFromResourcesRecursive(PDResources resources, int pageIndex, int depth) {
        List<ExtractedImage> result = new ArrayList<>();
        if (resources == null || depth > 25) return result;
        try {
            for (COSName name : resources.getXObjectNames()) {
                PDXObject xobj = resources.getXObject(name);
                if (xobj instanceof PDFormXObject formXObj) {
                    PDResources formRes = formXObj.getResources();
                    if (formRes != null) {
                        result.addAll(extractImagesFromResourcesRecursive(formRes, pageIndex, depth + 1));
                    }
                } else if (xobj instanceof PDImageXObject imgXObj) {
                    byte[] bytes = imageToBytes(imgXObj.getImage(), "png");
                    if (bytes != null && bytes.length > 0) {
                        result.add(new ExtractedImage(pageIndex, bytes, ".png"));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("页面资源图片提取失败 page={}", pageIndex, e);
        }
        return result;
    }

    private byte[] imageToBytes(BufferedImage img, String format) {
        if (img == null) return null;
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, format, baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.debug("图片转字节失败: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public ExtractionResult extractForAnalysis(byte[] pdfBytes, Integer userId) {
        String text = extractWithStructure(pdfBytes);
        boolean isLikelyScanned = false;
        List<String> imageUrls = new ArrayList<>();

        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            int pageCount = doc.getNumberOfPages();
            if ((text == null || text.trim().length() < MIN_TEXT_LENGTH) && pageCount > 0 && userId != null) {
                isLikelyScanned = true;
                List<ExtractedImage> images = extractImages(pdfBytes);
                for (ExtractedImage img : images) {
                    try {
                        String url = aliOssUtil.uploadPdfImage(userId, img.imageBytes(), img.suggestedSuffix());
                        imageUrls.add(url);
                    } catch (Exception e) {
                        log.warn("PDF 内嵌图片上传 OSS 失败", e);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("PDF 分析抽取异常", e);
        }

        return new ExtractionResult(
                text != null ? text : "",
                imageUrls,
                isLikelyScanned
        );
    }
}
