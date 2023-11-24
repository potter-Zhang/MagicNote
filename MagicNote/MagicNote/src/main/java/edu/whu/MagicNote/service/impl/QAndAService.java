package edu.whu.MagicNote.service.impl;

import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationResult;
import com.alibaba.dashscope.aigc.generation.models.QwenParam;
import com.alibaba.dashscope.common.Message;
import com.alibaba.dashscope.common.MessageManager;
import com.alibaba.dashscope.common.Role;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.utils.Constants;
import org.springframework.stereotype.Service;

@Service
public class QAndAService {

    private Generation gen = new Generation();

    private MessageManager msgManager = new MessageManager(1000000);

    public void init(String note) throws NoApiKeyException, InputRequiredException {

        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        msgManager = new MessageManager();
        Message systemMsg = Message.builder().role(Role.SYSTEM.getValue()).content("You are a helpful assistant.").build();
        String content1 = "接下来我会给出一篇笔记，你需要根据这篇笔记的内容回答我接下来的多个问题。这篇笔记的具体内容如下:" + note;
        Message userMsg1 = Message.builder().role(Role.USER.getValue()).content(content1).build();
        msgManager.add(systemMsg);
        msgManager.add(userMsg1);
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(msgManager.get())
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .enableSearch(false)    //只让其根据笔记内容回答问题，不可通过其他渠道进行搜索
                        .build();
        GenerationResult result = gen.call(param);
        System.out.println(result.getOutput().getChoices().get(0).getMessage().getContent());
        //System.out.println(JsonUtils.toJson(assistantMsg));
        Message assistantMsg = Message.builder().role(Role.ASSISTANT.getValue()).content(result.getOutput().getChoices().get(0).getMessage().getContent()).build();
        msgManager.add(assistantMsg);
    }

    public String answer(String question) throws NoApiKeyException, ApiException, InputRequiredException {

        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        Message usrMessage = Message.builder().role(Role.USER.getValue()).content(question).build();
        msgManager.add(usrMessage);
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(msgManager.get())
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .enableSearch(false)    //只让其根据笔记内容回答问题，不可通过其他渠道进行搜索
                        .build();

        GenerationResult result = gen.call(param);
        Message assistantMsg = Message.builder().role(Role.ASSISTANT.getValue()).content(result.getOutput().getChoices().get(0).getMessage().getContent()).build();
        msgManager.add(assistantMsg);
        System.out.println(result.getOutput().getChoices().get(0).getMessage().getContent());
        //System.out.println(JsonUtils.toJson(result));
        return result.getOutput().getChoices().get(0).getMessage().getContent();
    }
}
