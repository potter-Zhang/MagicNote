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
import io.reactivex.Flowable;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletResponse;
import java.io.*;

@Service
public class QAndAService {

    private Generation gen = new Generation();

    private MessageManager msgManager = new MessageManager(1000000);

    // 旧版的知识问答方法，使用通义千问
    public void init(String note) throws NoApiKeyException, InputRequiredException {

        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        msgManager = new MessageManager(1000000);
        Message systemMsg = Message.builder().role(Role.SYSTEM.getValue()).content("You are a helpful assistant.").build();
        String content1 = "接下来我会给出一篇笔记，你需要根据这篇笔记的内容回答我接下来的多个问题。" +
                "要求:你只能根据我提供的笔记回答问题，不能根据其他知识来源回答。若笔记中没有与我提的问题相关的内容，请回答\"笔记中没有提到\"。" +
                "这篇笔记的具体内容如下:" + note;
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

    public void answer(String question, HttpServletResponse response) throws NoApiKeyException, ApiException, InputRequiredException {

        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        Message usrMessage = Message.builder().role(Role.USER.getValue()).content(question).build();
        msgManager.add(usrMessage);
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(msgManager.get())
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .enableSearch(false)    //只让其根据笔记内容回答问题，不可通过其他渠道进行搜索
                        .incrementalOutput(true)
                        .build();

        Flowable<GenerationResult> result = gen.streamCall(param);
        StringBuilder fullContent = new StringBuilder();

        response.setContentType("text/event-stream");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");

        result.blockingForEach(message -> {
            fullContent.append(message.getOutput().getChoices().get(0).getMessage().getContent());
            response.getOutputStream().write(message.getOutput().getChoices().get(0).getMessage().getContent().getBytes());
            response.getOutputStream().flush();
        });
        System.out.println(fullContent.toString());

        Message assistantMsg = Message.builder().role(Role.ASSISTANT.getValue()).content(fullContent.toString()).build();
        msgManager.add(assistantMsg);
    }


    // 新版的知识问答方法，调用了python脚本（目前由于加入的逐字输出，这个不可实现逐字输出，先不考虑）
    public void initNew(String note) throws IOException {
        String path = System.getProperty("user.dir") + "/MagicNote/src/main/resources/test.txt";
        File newFile = new File(path);
        FileWriter writer = new FileWriter(newFile);
        writer.write(note);
        writer.close();
    }

    public String answerNew(String question) throws NoApiKeyException, ApiException, InputRequiredException, IOException {
        String pyPath = "D:\\在武大\\大三上\\JavaEE\\大作业\\java-ee-proj\\MagicNote\\MagicNote\\src\\main\\resources\\QA.py";

        // 传入python脚本的参数为question
        String[] args1 = new String[]{"python", pyPath, question};
        String actionStr;
        try {
            // 执行Python文件，并传入参数
            Process process = Runtime.getRuntime().exec(args1);
            // 获取Python输出字符串作为输入流被Java读取
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            actionStr = in.readLine();
            if (actionStr != null) {
                System.out.println(actionStr);
            }

            in.close();
            process.waitFor();
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        return actionStr;
    }
}
