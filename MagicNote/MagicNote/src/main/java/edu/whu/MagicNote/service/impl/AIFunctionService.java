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

    // 根据笔记的合适内容生成表格
    public String generateTable(String note) throws NoApiKeyException, InputRequiredException {
        Constants.apiKey = "sk-a513d206b66948ad8b27356775c8c829";

        String command ="请根据我的笔记，生成结构清晰的makedown格式的表格。\n" +
                "要求：1、保持表格的清晰排列和标签" +
                "2、根据笔记的内容主旨生成简短扼要的表格标题" +
                "3、表格内容能够保持和表格列标题一致时，用一个表格概括；否则可以用多个表格概括，但必须都要保持表格的格式"+
                "4、使用Markdown的表格语法创建表格。" +
                "给出的笔记是：\n";
        String prompt = command + note;

        Generation gen = new Generation();
        QwenParam param = QwenParam.builder().model("qwen-max").prompt(prompt)
                .topP(0.8).build();
        GenerationResult result = gen.call(param);

        System.out.println(result.getOutput().getText());
        return result.getOutput().getText();
    }

    // 根据笔记的合适内容生成流程图
    public String generateFlowChart(String note) throws NoApiKeyException, InputRequiredException {
        Constants.apiKey = "sk-a513d206b66948ad8b27356775c8c829";

        String command ="请从我的笔记中提取出关键词，并通过合理的逻辑关系以makedowm格式的流程图表示。\n" +
                "要求：1、类似的结点要多进行分支的流程图表示"+
                "2、使用Markdown语法创建流程图"+
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
