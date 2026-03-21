package com.anmory.yunji.service.impl;

import com.anmory.yunji.dto.EnrichedMemoItem;
import com.anmory.yunji.entity.File;
import com.anmory.yunji.entity.Memo;
import com.anmory.yunji.entity.Photo;
import com.anmory.yunji.entity.RecordComment;
import com.anmory.yunji.entity.Text;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.entity.UserDailyLog;
import com.anmory.yunji.entity.Voice;
import com.anmory.yunji.mapper.UserDailyLogMapper;
import com.anmory.yunji.mapper.RecordCommentMapper;
import com.anmory.yunji.mapper.RecordLikeMapper;
import com.anmory.yunji.service.MemoService;
import com.anmory.yunji.service.PdfExportService;
import com.anmory.yunji.utils.PregnancyWeekUtil;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.UserService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfExportServiceImpl implements PdfExportService {

    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy年M月d日 HH:mm");
    private static final float MARGIN = 48;
    private static final float CONTENT_WIDTH = PageSize.A4.getWidth() - MARGIN * 2;
    private static final float CELL_PAD = 36;
    private static final float IMAGE_MAX_WIDTH = Math.min(CONTENT_WIDTH - CELL_PAD, 400);
    private static final float IMAGE_MAX_HEIGHT = 320;

    /** PDF 结语页默认文案（AI 总结失败或写 PDF 异常时使用） */
    private static final String DEFAULT_PDF_CLOSING =
            "愿这段珍贵的孕期时光，成为您与家人最温暖的回忆。祝宝宝健康出生，家庭幸福美满。";

    private final MemoService memoService;
    private final OpenAiChatModel openAiChatModel;
    private final PromptService promptService;
    private final RecordLikeMapper recordLikeMapper;
    private final RecordCommentMapper recordCommentMapper;
    private final UserService userService;
    private final UserDailyLogMapper userDailyLogMapper;

    private Font fontTitle;
    private Font fontBody;
    private Font fontCaption;
    private Font fontCover;

    private void ensureFonts() throws DocumentException {
        if (fontTitle != null) return;
        BaseFont bf = null;
        try {
            // 优先尝试从classpath加载字体
            try (InputStream is = getClass().getResourceAsStream("/fonts/NotoSansCJK-Regular.otf")) {
                if (is != null) {
                    byte[] fontData = is.readAllBytes();
                    bf = BaseFont.createFont("NotoSansCJK-Regular.otf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontData, null);
                    log.info("成功从classpath加载中文字体: /fonts/NotoSansCJK-Regular.otf");
                }
            } catch (Exception e) {
                log.debug("Classpath字体加载失败", e);
            }

            // 如果classpath字体加载失败，尝试系统字体路径
            if (bf == null) {
                String[] paths = {
                        "C:/Windows/Fonts/STZHONGS.TTF",
                        "C:/Windows/Fonts/stzhongs.ttf",
                        "C:/Windows/Fonts/msyh.ttc,0",
                        "C:/Windows/Fonts/simsun.ttc,0",
                        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
                        "/System/Library/Fonts/PingFang.ttc",
                };
                for (String path : paths) {
                    try {
                        bf = BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                        log.info("成功从系统路径加载中文字体: {}", path);
                        break;
                    } catch (Exception ignored) {
                        log.debug("系统字体路径 {} 不可用", path);
                    }
                }
            }

            // 如果所有字体都加载失败，使用内置字体但尝试更好的中文字体支持
            if (bf == null) {
                log.warn("未找到中文字体，尝试使用内置字体，中文显示可能受限");
                try {
                    // 尝试使用iText内置的CJK字体
                    bf = BaseFont.createFont("STSong-Light", "UniGB-UCS2-H", BaseFont.NOT_EMBEDDED);
                    log.info("使用iText内置中文字体: STSong-Light");
                } catch (Exception e) {
                    log.warn("iText内置中文字体也无法加载，使用默认Helvetica字体", e);
                    bf = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
                }
            }

            fontTitle = new Font(bf, 14, Font.BOLD, new Color(45, 43, 41));
            fontBody = new Font(bf, 11, Font.NORMAL, new Color(55, 53, 51));
            fontCaption = new Font(bf, 9, Font.NORMAL, new Color(120, 118, 115));
            fontCover = new Font(bf, 24, Font.BOLD, new Color(60, 58, 56));

            log.info("PDF字体初始化完成，使用字体: {}", bf.getPostscriptFontName());
        } catch (Exception e) {
            log.error("字体初始化失败，使用默认Helvetica字体", e);
            // 最后的兜底方案
            fontTitle = FontFactory.getFont(FontFactory.HELVETICA, 14, Font.BOLD);
            fontBody = FontFactory.getFont(FontFactory.HELVETICA, 11);
            fontCaption = FontFactory.getFont(FontFactory.HELVETICA, 9);
            fontCover = FontFactory.getFont(FontFactory.HELVETICA, 24, Font.BOLD);
        }
    }

    @Override
    public void exportToPdf(Integer userId, String username, OutputStream output) {
        List<EnrichedMemoItem> items = loadEnrichedItems(userId);
        exportToPdfInternal(items, userId, username, output);
    }

    @Override
    public void exportDateRangePdf(Integer userId, LocalDate fromDate, LocalDate toDate, String username, OutputStream output) {
        List<EnrichedMemoItem> all = loadEnrichedItems(userId);
        List<EnrichedMemoItem> filtered = all.stream()
                .filter(item -> item.getCreatedAt() != null)
                .filter(item -> {
                    LocalDate d = item.getCreatedAt().toLocalDate();
                    return !d.isBefore(fromDate) && !d.isAfter(toDate);
                })
                .collect(Collectors.toList());
        exportToPdfInternal(filtered, userId, username, output);
    }

    @Override
    public void exportToPdf(List<EnrichedMemoItem> items, String username, OutputStream output) {
        exportToPdfInternal(items, null, username, output);
    }

    private void exportToPdfInternal(List<EnrichedMemoItem> items, Integer userId, String username, OutputStream output) {
        try {
            ensureFonts();
            Document doc = new Document(PageSize.A4, MARGIN, MARGIN, MARGIN, MARGIN);
            PdfWriter writer = PdfWriter.getInstance(doc, output);
            writer.setPageEvent(new PdfBackgroundEvent());

            doc.open();

            // 添加封面
            try {
                addCover(doc, username, userId);
            } catch (Exception e) {
                log.warn("PDF封面添加失败，使用默认封面", e);
                addDefaultCover(doc, username);
            }
            doc.newPage();

            // 添加记录内容
            int index = 1;
            for (EnrichedMemoItem item : items) {
                try {
                    addRecord(doc, index++, item);
                } catch (Exception e) {
                    log.warn("PDF记录添加失败，跳过记录 index={}, type={}, error={}", index - 1, item.getType(), e.getMessage());
                    // 继续处理其他记录
                }
            }

            // 添加AI总结，如果失败则添加默认结语
            try {
                addAiSummary(doc, items, username);
            } catch (Exception e) {
                log.warn("PDF AI总结页添加失败，使用默认结语", e);
                try {
                    addDefaultClosingPage(doc);
                } catch (Exception e2) {
                    log.error("默认结语页写入失败", e2);
                }
            }

            doc.close();
            log.info("PDF导出成功，共{}条记录", items.size());
        } catch (Exception e) {
            log.error("PDF导出失败", e);
            throw new RuntimeException("PDF导出失败: " + e.getMessage(), e);
        }
    }

    /** 仅追加一页默认结语（addAiSummary 异常时兜底） */
    private void addDefaultClosingPage(Document doc) throws DocumentException {
        doc.newPage();
        Paragraph header = new Paragraph("—— 结语 · 寄语 ——", fontTitle);
        header.setAlignment(Element.ALIGN_CENTER);
        header.setSpacingBefore(100);
        header.setSpacingAfter(32);
        doc.add(header);
        Paragraph p = new Paragraph(DEFAULT_PDF_CLOSING, fontBody);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setLeading(32);
        p.setSpacingBefore(16);
        p.setSpacingAfter(48);
        doc.add(p);
        Paragraph sign = new Paragraph("—— 孕期宝 · 温暖陪伴每一天 ——", fontCaption);
        sign.setAlignment(Element.ALIGN_CENTER);
        sign.setSpacingBefore(24);
        doc.add(sign);
    }

    @Override
    public List<EnrichedMemoItem> loadEnrichedItems(Integer userId) {
        List<Memo> memos = memoService.getAllMemoByUserId(userId);
        List<Text> texts = memoService.getTextByUserId(userId);
        List<Voice> voices = memoService.getVoiceByUserId(userId);
        List<Photo> photos = memoService.getPhotoByUserId(userId);
        List<File> files = memoService.getFileByUserId(userId);
        Map<Integer, Text> textByMemo = (texts != null ? texts : List.<Text>of()).stream().collect(Collectors.toMap(Text::getMemoId, t -> t));
        Map<Integer, Voice> voiceByMemo = (voices != null ? voices : List.<Voice>of()).stream().collect(Collectors.toMap(Voice::getMemoId, v -> v));
        Map<Integer, List<String>> photoUrlsByMemo = new HashMap<>();
        if (photos != null) {
            for (Photo p : photos) {
                String url = p.getUrl();
                if (url != null && !url.isEmpty()) {
                    photoUrlsByMemo.computeIfAbsent(p.getMemoId(), k -> new ArrayList<>()).add(url);
                }
            }
        }
        Map<Integer, String> photoDescByMemo = (photos != null ? photos : List.<Photo>of()).stream()
                .filter(p -> p.getPhotoDescription() != null)
                .collect(Collectors.toMap(Photo::getMemoId, Photo::getPhotoDescription, (a, b) -> a));
        Map<Integer, File> fileByMemo = (files != null ? files : List.<File>of()).stream().collect(Collectors.toMap(File::getMemoId, f -> f));
        Map<LocalDate, Double> weightByDate = new HashMap<>();
        List<UserDailyLog> dailyLogs = userDailyLogMapper.findByUserAndDateRange(userId, LocalDate.of(1970, 1, 1), LocalDate.now());
        if (dailyLogs != null) {
            for (UserDailyLog log : dailyLogs) {
                if (log.getRecordDate() != null && log.getWeightKg() != null) {
                    weightByDate.put(log.getRecordDate(), log.getWeightKg());
                }
            }
        }
        return buildEnrichedList(memos, textByMemo, voiceByMemo, photoUrlsByMemo, photoDescByMemo, fileByMemo, weightByDate);
    }

    @Override
    public List<EnrichedMemoItem> loadEnrichedItemsPaged(Integer userId, Integer requestUserId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        List<Memo> memos = memoService.getAllMemoByUserIdPaged(userId, requestUserId, pageSize, offset);
        if (memos == null || memos.isEmpty()) return List.of();
        List<Integer> memoIds = memos.stream().map(Memo::getMemoId).filter(java.util.Objects::nonNull).distinct().toList();
        List<Text> texts = memoService.getTextByMemoIds(memoIds);
        List<Voice> voices = memoService.getVoiceByMemoIds(memoIds);
        List<Photo> photos = memoService.getPhotoByMemoIds(memoIds);
        List<File> files = memoService.getFileByMemoIds(memoIds);
        Map<Integer, Text> textByMemo = (texts != null ? texts : List.<Text>of()).stream().collect(Collectors.toMap(Text::getMemoId, t -> t));
        Map<Integer, Voice> voiceByMemo = (voices != null ? voices : List.<Voice>of()).stream().collect(Collectors.toMap(Voice::getMemoId, v -> v));
        Map<Integer, List<String>> photoUrlsByMemo = new HashMap<>();
        if (photos != null) {
            for (Photo p : photos) {
                String url = p.getUrl();
                if (url != null && !url.isEmpty()) {
                    photoUrlsByMemo.computeIfAbsent(p.getMemoId(), k -> new ArrayList<>()).add(url);
                }
            }
        }
        Map<Integer, String> photoDescByMemo = (photos != null ? photos : List.<Photo>of()).stream()
                .filter(p -> p.getPhotoDescription() != null)
                .collect(Collectors.toMap(Photo::getMemoId, Photo::getPhotoDescription, (a, b) -> a));
        Map<Integer, File> fileByMemo = (files != null ? files : List.<File>of()).stream().collect(Collectors.toMap(File::getMemoId, f -> f));
        return buildEnrichedList(memos, textByMemo, voiceByMemo, photoUrlsByMemo, photoDescByMemo, fileByMemo, Map.of());
    }

    private List<EnrichedMemoItem> buildEnrichedList(List<Memo> memos,
            Map<Integer, Text> textByMemo, Map<Integer, Voice> voiceByMemo, Map<Integer, List<String>> photoUrlsByMemo, Map<Integer, String> photoDescByMemo, Map<Integer, File> fileByMemo, Map<LocalDate, Double> weightByDate) {
        List<EnrichedMemoItem> result = new ArrayList<>();
        for (Memo m : (memos != null ? memos : List.<Memo>of())) {
            EnrichedMemoItem item = new EnrichedMemoItem();
            item.setMemoId(m.getMemoId());
            item.setType(m.getType());
            item.setCreatedAt(m.getCreatedAt());
            item.setPregnancyWeek(m.getPregnancyWeek());
            item.setPregnancyWeekIndex(m.getPregnancyWeekIndex());
            item.setTag(m.getTag());
            item.setMood(m.getMood());
            item.setCommentCount(recordCommentMapper.selectByMemoId(m.getMemoId()).size());
            if (m.getRecordWeightKg() != null) {
                item.setWeightKg(m.getRecordWeightKg());
            } else if (m.getCreatedAt() != null) {
                item.setWeightKg(weightByDate.get(m.getCreatedAt().toLocalDate()));
            }

            switch (m.getType()) {
                case "text" -> {
                    Text t = textByMemo.get(m.getMemoId());
                    if (t != null) {
                        item.setTitle(t.getTitle());
                        item.setContent(t.getContent());
                    }
                }
                case "voice" -> {
                    Voice v = voiceByMemo.get(m.getMemoId());
                    if (v != null) {
                        item.setTitle(v.getTitle());
                        item.setVoiceUrl(v.getUrl());
                        item.setContent("语音记录");
                    }
                }
                case "photo" -> {
                    item.setTitle(m.getPhotoTitle());
                    item.setPhotoUrls(photoUrlsByMemo.getOrDefault(m.getMemoId(), List.of()));
                    item.setPhotoDescription(m.getPhotoDescription() != null ? m.getPhotoDescription() : photoDescByMemo.get(m.getMemoId()));
                    item.setContent(item.getPhotoDescription() != null ? item.getPhotoDescription() : "照片记录");
                }
                case "file" -> {
                    File f = fileByMemo.get(m.getMemoId());
                    if (f != null) {
                        item.setTitle(f.getTitle());
                        item.setFileUrl(f.getUrl());
                        item.setContent("文件：" + f.getTitle());
                    }
                }
                default -> item.setContent("记录");
            }
            result.add(item);
        }

        result.sort((a, b) -> {
            int wa = a.getPregnancyWeekIndex() == null ? Integer.MAX_VALUE : a.getPregnancyWeekIndex();
            int wb = b.getPregnancyWeekIndex() == null ? Integer.MAX_VALUE : b.getPregnancyWeekIndex();
            if (wa != wb) return Integer.compare(wa, wb);
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return a.getCreatedAt().compareTo(b.getCreatedAt());
        });
        return result;
    }

    private String calcPregnancyWeek(Integer userId) {
        if (userId == null) return null;
        User user = userService.getById(userId);
        if (user == null || user.getLastMenstrualDate() == null) return null;
        return PregnancyWeekUtil.calculatePregnancyWeek(user.getLastMenstrualDate());
    }

    private void addCover(Document doc, String username, Integer userId) throws DocumentException {
        Paragraph ornament = new Paragraph("❀  ✦  ❀", fontCaption);
        ornament.setAlignment(Element.ALIGN_CENTER);
        ornament.setSpacingBefore(120);
        doc.add(ornament);

        Paragraph title = new Paragraph("孕期纪念册", fontCover);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingBefore(24);
        doc.add(title);

        Paragraph sub = new Paragraph(username + " 的珍藏时光", fontBody);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingBefore(32);
        doc.add(sub);

        // 孕周：放大字体、居中、分割线
        String pregnancyWeekStr = userId != null ? calcPregnancyWeek(userId) : null;
        if (pregnancyWeekStr != null && !pregnancyWeekStr.isEmpty()) {
            Paragraph weekDivider = new Paragraph("— · — · — · —", fontCaption);
            weekDivider.setAlignment(Element.ALIGN_CENTER);
            weekDivider.setSpacingBefore(28);
            doc.add(weekDivider);

            Font fontWeek = new Font(fontTitle.getBaseFont(), 22, Font.BOLD, new Color(60, 58, 56));
            Paragraph weekP = new Paragraph("孕周 " + pregnancyWeekStr, fontWeek);
            weekP.setAlignment(Element.ALIGN_CENTER);
            weekP.setSpacingBefore(12);
            weekP.setSpacingAfter(12);
            doc.add(weekP);

            Paragraph weekDivider2 = new Paragraph("— · — · — · —", fontCaption);
            weekDivider2.setAlignment(Element.ALIGN_CENTER);
            weekDivider2.setSpacingBefore(0);
            weekDivider2.setSpacingAfter(12);
            doc.add(weekDivider2);
            try {
                int weekNum = Integer.parseInt(pregnancyWeekStr.replaceAll("[^0-9]", ""));
                String babySize = PregnancyWeekUtil.getBabySizeDescription(weekNum);
                if (!babySize.isEmpty()) {
                    Paragraph babyP = new Paragraph("宝宝大小 " + babySize, fontCaption);
                    babyP.setAlignment(Element.ALIGN_CENTER);
                    babyP.setSpacingAfter(12);
                    doc.add(babyP);
                }
            } catch (NumberFormatException ignored) {}
        }

        Paragraph line = new Paragraph("— · — · — · —", fontCaption);
        line.setAlignment(Element.ALIGN_CENTER);
        line.setSpacingBefore(pregnancyWeekStr != null ? 0 : 40);
        doc.add(line);

        Paragraph date = new Paragraph("导出时间 " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy年M月d日 HH:mm")), fontCaption);
        date.setAlignment(Element.ALIGN_CENTER);
        date.setSpacingBefore(16);
        doc.add(date);

        Paragraph footer = new Paragraph("愿此刻的记录，成为永恒的美好", fontCaption);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(80);
        doc.add(footer);
    }

    /** 默认封面（addCover 异常时兜底） */
    private void addDefaultCover(Document doc, String username) throws DocumentException {
        Paragraph ornament = new Paragraph("❀  ✦  ❀", fontCaption);
        ornament.setAlignment(Element.ALIGN_CENTER);
        ornament.setSpacingBefore(120);
        doc.add(ornament);

        Paragraph title = new Paragraph("孕期纪念册", fontCover);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingBefore(24);
        doc.add(title);

        Paragraph sub = new Paragraph(username + " 的珍藏时光", fontBody);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingBefore(32);
        doc.add(sub);

        Paragraph line = new Paragraph("— · — · — · —", fontCaption);
        line.setAlignment(Element.ALIGN_CENTER);
        line.setSpacingBefore(40);
        doc.add(line);

        Paragraph date = new Paragraph("导出时间 " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy年M月d日 HH:mm")), fontCaption);
        date.setAlignment(Element.ALIGN_CENTER);
        date.setSpacingBefore(16);
        doc.add(date);

        Paragraph footer = new Paragraph("愿此刻的记录，成为永恒的美好", fontCaption);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(80);
        doc.add(footer);
    }

    private void addAiSummary(Document doc, List<EnrichedMemoItem> items, String username) throws DocumentException {
        String summary = generateAiSummary(items, username);
        if (summary == null || summary.isEmpty()) {
            summary = DEFAULT_PDF_CLOSING;
        }
        doc.newPage();
        Paragraph header = new Paragraph("—— 结语 · 寄语 ——", fontTitle);
        header.setAlignment(Element.ALIGN_CENTER);
        header.setSpacingBefore(100);
        header.setSpacingAfter(32);
        doc.add(header);
        Paragraph p = new Paragraph(summary, fontBody);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setLeading(32);
        p.setSpacingBefore(16);
        p.setSpacingAfter(48);
        doc.add(p);
        Paragraph sign = new Paragraph("—— 孕期宝 · 温暖陪伴每一天 ——", fontCaption);
        sign.setAlignment(Element.ALIGN_CENTER);
        sign.setSpacingBefore(24);
        doc.add(sign);
    }

    private String generateAiSummary(List<EnrichedMemoItem> items, String username) {
        try {
            StringBuilder ctx = new StringBuilder();
            for (int i = 0; i < Math.min(items.size(), 20); i++) {
                EnrichedMemoItem it = items.get(i);
                String c = it.getContent();
                if (c == null) c = "";
                if (it.getTitle() != null && !it.getTitle().isEmpty()) c = it.getTitle() + " " + c;
                if (c.length() > 100) c = c.substring(0, 100) + "…";
                ctx.append(c).append("\n");
            }
            String prompt = promptService.getUserPrompt("pdf_summary", "default",
                    Map.of("username", username != null ? username : "", "count", String.valueOf(items.size()), "context", ctx.toString()));
            if (prompt == null || prompt.isBlank()) {
                prompt = "这是一位准妈妈「" + username + "」的孕期记录内容（共" + items.size() + "条）：\n\n" + ctx.toString()
                        + "\n请基于上述记录写一段约300字的中文总结与寄语。"
                        + "要求：有情绪价值、温柔细腻、像纪念册结语；多使用完整句子，分2-3段自然换行；"
                        + "不要机械罗列日期，不要使用序号，不要加标题，不要使用引号。";
            }
            return ChatClient.builder(openAiChatModel).build().prompt().user(prompt).call().content();
        } catch (Exception e) {
            log.warn("AI 总结生成失败", e);
            return null;
        }
    }

    private void addRecord(Document doc, int index, EnrichedMemoItem item) throws DocumentException {
        String typeLabel = "letter_to_baby".equals(item.getTag())
                ? "给宝宝的信"
                : switch (item.getType()) {
                    case "text" -> "文字";
                    case "voice" -> "语音";
                    case "photo" -> "照片";
                    case "file" -> "文件";
                    default -> "记录";
                };

        if (index > 1) {
            PdfPTable sep = new PdfPTable(1);
            sep.setWidthPercentage(100f);
            sep.setSpacingBefore(20);
            sep.setSpacingAfter(8);
            PdfPCell lineCell = new PdfPCell();
            lineCell.setBorderWidth(0);
            lineCell.setFixedHeight(3);
            lineCell.setBackgroundColor(new Color(232, 200, 194));
            sep.addCell(lineCell);
            doc.add(sep);
        }

        PdfPTable block = new PdfPTable(1);
        block.setWidthPercentage(100f);
        block.setSpacingBefore(0);
        block.setSpacingAfter(0);
        PdfPCell cell = new PdfPCell();
        cell.setBorderWidth(0);
        cell.setPadding(18);
        cell.setBackgroundColor(new Color(255, 252, 250));
        cell.setBorderColor(new Color(240, 220, 215));
        cell.setBorderWidthLeft(1);
        cell.setBorderWidthBottom(1);

        Paragraph header = new Paragraph();
        header.add(new Chunk("◆ ", new Font(fontTitle.getBaseFont(), 12, Font.NORMAL, new Color(227, 184, 176))));
        String recordByLabel = "mom".equals(item.getRecordBy()) ? "妈妈 " : "dad".equals(item.getRecordBy()) ? "爸爸 " : "";
        header.add(new Chunk("【" + index + "】 " + recordByLabel + typeLabel + "  ", fontTitle));
        if (item.getCreatedAt() != null) {
            header.add(new Chunk(item.getCreatedAt().format(DF) + "  ", fontCaption));
        }
        if (item.getPregnancyWeek() != null && !item.getPregnancyWeek().isEmpty()) {
            header.add(new Chunk("孕" + item.getPregnancyWeek(), fontCaption));
        }
        if (item.getMood() != null && !item.getMood().isEmpty()) {
            header.add(new Chunk("  心情 " + item.getMood(), fontCaption));
        }
        if (item.getTag() != null && !item.getTag().isEmpty() && !"letter_to_baby".equals(item.getTag())) {
            header.add(new Chunk("  标签 " + item.getTag(), fontCaption));
        }
        if (item.getWeightKg() != null) {
            header.add(new Chunk("  体重 " + String.format("%.1fkg", item.getWeightKg()), fontCaption));
        }
        if (item.getCommentCount() != null && item.getCommentCount() > 0) {
            header.add(new Chunk("  评论 " + item.getCommentCount() + " 条", fontCaption));
        }
        header.setSpacingBefore(0);
        header.setSpacingAfter(14);
        cell.addElement(header);

        if (item.getTitle() != null && !item.getTitle().isEmpty()) {
            Paragraph titleP = new Paragraph(item.getTitle(), fontBody);
            titleP.setSpacingAfter(10);
            cell.addElement(titleP);
        }

        if (item.getType().equals("photo") && item.getPhotoUrls() != null && !item.getPhotoUrls().isEmpty()) {
            if (item.getPhotoDescription() != null && !item.getPhotoDescription().isEmpty()) {
                Paragraph desc = new Paragraph(item.getPhotoDescription(), fontBody);
                desc.setLeading(20);
                desc.setSpacingAfter(12);
                cell.addElement(desc);
            }
            for (String url : item.getPhotoUrls()) {
                addImageToCell(cell, url);
            }
        } else if (item.getType().equals("file")) {
            String fn = item.getTitle() != null ? item.getTitle() : "文件";
            String url = item.getFileUrl();
            cell.addElement(new Paragraph("文件名：" + fn, fontBody));
            if (url != null && !url.isEmpty()) {
                cell.addElement(new Paragraph("链接：" + url, fontCaption));
            }
        } else if (item.getContent() != null && !item.getContent().isEmpty()) {
            Paragraph p = new Paragraph(item.getContent(), fontBody);
            p.setLeading(22);
            p.setSpacingAfter(0);
            cell.addElement(p);
        }

        // 互动信息：点赞数量 + 评论内容
        int likeCount = recordLikeMapper.countByMemoId(item.getMemoId());
        Paragraph likeInfo = new Paragraph("点赞：" + likeCount, fontCaption);
        likeInfo.setSpacingBefore(10);
        likeInfo.setSpacingAfter(4);
        cell.addElement(likeInfo);

        List<RecordComment> comments = recordCommentMapper.selectByMemoId(item.getMemoId());
        if (comments != null && !comments.isEmpty()) {
            Paragraph cHeader = new Paragraph("评论摘录：", fontCaption);
            cHeader.setSpacingBefore(2);
            cHeader.setSpacingAfter(4);
            cell.addElement(cHeader);
            int limit = Math.min(comments.size(), 5);
            for (int i = 0; i < limit; i++) {
                RecordComment c = comments.get(i);
                User u = userService.getById(c.getUserId());
                String uname = (u != null && u.getUsername() != null && !u.getUsername().isEmpty()) ? u.getUsername() : "家人";
                String content = c.getContent() == null ? "" : c.getContent().replace("\n", " ").trim();
                if (content.length() > 90) {
                    content = content.substring(0, 90) + "…";
                }
                Paragraph one = new Paragraph("· " + uname + "： " + content, fontCaption);
                one.setLeading(16);
                one.setSpacingAfter(2);
                cell.addElement(one);
            }
        }

        block.addCell(cell);
        doc.add(block);
    }

    private void addImageToCell(PdfPCell cell, String imageUrl) throws DocumentException {
        Image img = null;
        try {
            byte[] bytes = fetchImageBytes(imageUrl);
            if (bytes != null && bytes.length > 0) {
                img = Image.getInstance(bytes);
            } else {
                img = Image.getInstance(new URL(imageUrl));
            }
        } catch (Exception e) {
            log.debug("添加图片失败: {}", imageUrl, e);
        }
        if (img == null) {
            cell.addElement(new Paragraph("（图片加载失败）", fontCaption));
            return;
        }
        float w = img.getWidth();
        float h = img.getHeight();
        if (w <= 0 || h <= 0) {
            img.scaleToFit(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT);
        } else {
            float scale = Math.min(Math.min(IMAGE_MAX_WIDTH / w, IMAGE_MAX_HEIGHT / h), 1f);
            img.scalePercent(scale * 100);
        }
        img.setAlignment(Image.ALIGN_CENTER);
        Paragraph wrapper = new Paragraph();
        wrapper.add(new Chunk(img, 0, 0, true));
        wrapper.setAlignment(Element.ALIGN_CENTER);
        wrapper.setSpacingBefore(8);
        wrapper.setSpacingAfter(8);
        cell.addElement(wrapper);
    }

    /** 尝试通过 HttpClient 获取图片（解决部分 CDN 需要 User-Agent 等问题） */
    private byte[] fetchImageBytes(String imageUrl) {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpGet get = new HttpGet(imageUrl);
            get.setHeader("User-Agent", "Mozilla/5.0 (compatible; YunJiPDF/1.0)");
            get.setHeader("Accept", "image/*");
            try (var resp = client.execute(get)) {
                int code = resp.getStatusLine().getStatusCode();
                if (code >= 200 && code < 300 && resp.getEntity() != null) {
                    return EntityUtils.toByteArray(resp.getEntity());
                }
            }
        } catch (Exception e) {
            log.debug("HttpClient 获取图片失败: {}", imageUrl, e);
        }
        return null;
    }

    /** 页面背景：温暖底色 + 花纹边框 + 四角装饰 */
    private static class PdfBackgroundEvent extends PdfPageEventHelper {
        private static final Color BG = new Color(253, 248, 243);
        private static final Color BORDER = new Color(232, 200, 194);
        private static final Color ACCENT = new Color(227, 184, 176);
        private static final float M = 36;

        @Override
        public void onEndPage(com.lowagie.text.pdf.PdfWriter writer, Document document) {
            PdfContentByte canvas = writer.getDirectContentUnder();
            Rectangle rect = document.getPageSize();
            float w = rect.getWidth();
            float h = rect.getHeight();

            canvas.saveState();
            canvas.setColorFill(BG);
            canvas.rectangle(0, 0, w, h);
            canvas.fill();
            canvas.restoreState();

            canvas.saveState();
            canvas.setLineWidth(1f);
            canvas.setColorStroke(BORDER);
            canvas.rectangle(M, M, w - M * 2, h - M * 2);
            canvas.stroke();
            canvas.restoreState();

            canvas.saveState();
            canvas.setLineWidth(0.5f);
            canvas.setColorStroke(ACCENT);
            canvas.rectangle(M + 8, M + 8, w - M * 2 - 16, h - M * 2 - 16);
            canvas.stroke();
            canvas.restoreState();

            drawCornerFlourish(canvas, M, h - M, 1, 1);
            drawCornerFlourish(canvas, w - M, h - M, -1, 1);
            drawCornerFlourish(canvas, M, M, 1, -1);
            drawCornerFlourish(canvas, w - M, M, -1, -1);

            float footerY = 32;
            canvas.saveState();
            canvas.setColorFill(ACCENT);
            canvas.rectangle(M, footerY, w - M * 2, 2);
            canvas.fill();
            canvas.restoreState();
        }

        private void drawCornerFlourish(PdfContentByte cb, float x, float y, float dx, float dy) {
            cb.saveState();
            cb.setColorStroke(BORDER);
            cb.setLineWidth(0.8f);
            float len = 20;
            cb.moveTo(x, y);
            cb.lineTo(x + dx * len, y);
            cb.moveTo(x, y);
            cb.lineTo(x, y + dy * len);
            cb.moveTo(x + dx * 6, y + dy * 6);
            cb.lineTo(x + dx * len, y + dy * 6);
            cb.moveTo(x + dx * 6, y + dy * 6);
            cb.lineTo(x + dx * 6, y + dy * len);
            cb.stroke();
            cb.restoreState();
        }
    }
}
