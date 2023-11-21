package edu.whu.MagicNote.service.impl;

import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationResult;
import com.alibaba.dashscope.aigc.generation.models.QwenParam;
import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.utils.Constants;
import org.springframework.stereotype.Service;

@Service
public class AIFunctionService {

    // 缩写、提炼笔记信息的方法
    public String abstractNote(String note) throws NoApiKeyException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";

        String command = "接下来我会给出我的笔记，你需要提炼、 缩写我的笔记，尽量精简。\n" +
                "最终输出为markdown格式，同时你需要将最重要的那些信息在markdown中进行加粗。最后只需要输出最终结果的markdown，无需其他提示信息。\n" +
                "给出的笔记是：\n";

        String prompt = command + note;

        Generation gen = new Generation();
        QwenParam param = QwenParam.builder().model("qwen-max").prompt(prompt)
                .topP(0.8).build();
        GenerationResult result = gen.call(param);

        System.out.println(result.getOutput().getText());
        return result.getOutput().getText();
    }

    // 扩写笔记的方法
    public String expandNote(String note) throws NoApiKeyException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";

        String command = "接下来我会给出我的笔记，你需要根据关键信息扩写我的笔记，尽量详细。\n" +
                "同时你需要将其中你认为的最重要的那些信息进行加粗，最终输出为markdown格式。最后只需要输出markdown文本。\n" +
                "给出的笔记是：\n";

        String prompt = command + note;

        Generation gen = new Generation();
        QwenParam param = QwenParam.builder().model("qwen-max").prompt(prompt)
                .topP(0.8).build();
        GenerationResult result = gen.call(param);

        System.out.println(result.getOutput().getText());
        return result.getOutput().getText();
    }

    // 根据关键词生成笔记的方法
    public String generateNote(String words, int num) throws NoApiKeyException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";

        String command = "接下来我会给出一些关键词，这些关键词使用分号间隔，你需要根据这些关键词生成一篇" + num + "字以上的中文笔记，尽量详细。\n" +
                "同时你需要将其中你认为的最重要的那些信息进行加粗，最终输出为markdown格式。最后只需要输出markdown文本。\n" +
                "给出的关键词是：\n";

        String prompt = command + words;

        Generation gen = new Generation();
        QwenParam param = QwenParam.builder().model("qwen-max").prompt(prompt)
                .topP(0.8).build();
        GenerationResult result = gen.call(param);

        System.out.println(result.getOutput().getText());
        return result.getOutput().getText();
    }

    // 将笔记分段
    public String segmentNote(String note) throws NoApiKeyException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";

        String command = "接下来我会给出一篇笔记，请将其根据内容使用各级标题进行合理的分段。\n" +
                "最终输出为markdown格式。最后只需要输出markdown文本。\n" +
                "给出的笔记是：\n";

        String prompt = command + note;

        Generation gen = new Generation();
        QwenParam param = QwenParam.builder().model("qwen-max").prompt(prompt)
                .topP(0.8).build();
        GenerationResult result = gen.call(param);

        System.out.println(result.getOutput().getText());
        return result.getOutput().getText();
    }

}
