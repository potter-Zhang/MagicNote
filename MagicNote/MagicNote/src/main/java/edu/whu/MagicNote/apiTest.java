package edu.whu.MagicNote;

import com.alibaba.dashscope.aigc.conversation.Conversation;
import com.alibaba.dashscope.aigc.conversation.ConversationParam;
import com.alibaba.dashscope.aigc.conversation.ConversationResult;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.utils.Constants;

public class apiTest {

    public static void quickStart() throws ApiException, NoApiKeyException, InputRequiredException {
        Constants.apiKey = "sk-77814de60d1743739e87f1981ab1bd6f";
        Conversation conversation = new Conversation();
        String prompt = "用萝卜、土豆、茄子做饭，给我个菜谱。";
        ConversationParam param = ConversationParam
                .builder()
                .model(Conversation.Models.QWEN_TURBO)
                .prompt(prompt)
                .build();
        ConversationResult result = conversation.call(param);
        System.out.println(result.getOutput().getText());
    }

    public static void main(String[] args) {
        try {
            quickStart();
        } catch (ApiException | NoApiKeyException | InputRequiredException e) {
            System.out.println(e.getMessage());
        }
        System.exit(0);
    }
}
