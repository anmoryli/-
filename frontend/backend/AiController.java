package com.anmory.yunji.controller;

import com.anmory.yunji.common.RagService;
import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.Conversation;
import com.anmory.yunji.entity.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/ai")
public class AiController {
    @Autowired private RagService ragService;

    /*
    * 自己训练的大模型最好可以支持多轮对话
    * 需要做一些前置的处理
    * 1. 不同的模态给AI的提示词不一样，需要编写一个json文件去写AI的提示词，具体可以参考json文件夹里面我之前编写过的json提示词
    * 2. 不同的模态首先需要调用不同的模型先转成文字，然后才能发送给自己的大模型，因为自己的大模型只能支持文字，没办法多模态，如果能训练出多模态的除外
    * */

    // 创建会话
    @RequestMapping("/createConversation")
    public Result<Conversation> createConversation(@RequestParam Integer userId,
                                                   @RequestParam(required = false) String title) {
        return Result.success();
    }

    // 获取会话列表
    @RequestMapping("/conversation/list")
    public Result<List<Conversation>> listConversations(@RequestParam Integer userId) {
        return Result.success();
    }

    // 删除会话
    @RequestMapping("/deleteConversation")
    public Result<Integer> deleteConversation(@RequestParam Integer userId,
                                                  @RequestParam Integer conversationId) {
        return Result.success();
    }

    // 具体和AI对话的函数
    @RequestMapping("/chat")
    public Result<Message> chat(@RequestParam Integer userId,
                                @RequestParam Integer conversationId,
                                @RequestParam String question) throws IOException {
        // 先去向量数据库获取相关片段
        String relevant = ragService.getRelevant(question);
        // 需要调用自己训练的大模型
        return Result.success();
    }

    // 获取会话历史
    @RequestMapping("/conversation/history")
    public Result<List<Message>> getHistory(@RequestParam Integer userId,
                                          @RequestParam Integer conversationId) {
        return Result.success();
    }

}
