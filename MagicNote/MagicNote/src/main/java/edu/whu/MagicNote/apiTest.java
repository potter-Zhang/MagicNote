package edu.whu.MagicNote;

import com.alibaba.dashscope.aigc.conversation.Conversation;
import com.alibaba.dashscope.aigc.conversation.ConversationParam;
import com.alibaba.dashscope.aigc.conversation.ConversationResult;
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
import edu.whu.MagicNote.service.impl.AIFunctionService;
import edu.whu.MagicNote.service.impl.OcrService;
import edu.whu.MagicNote.service.impl.QAndAService;
import io.reactivex.Flowable;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.IOException;
import java.util.Arrays;


public class apiTest {


    static String s0 = "接下来我会给出我的笔记，你需要根据我的笔记生成flow格式的markdown格式的流程图。\n" +
            //"同时你需要将其中的最重要的那些信息进行加粗，最终输出为markdown格式。最后只需要输出markdown。\n" +
            //"你需要扩写笔记内容，输出为markdown格式，markdown笔记格式丰富一些，多进行字体加粗、字体色彩、分段等。\n" +
            //"然后你需要根据续写的笔记内容生成思维导图，也输出为markdown格式，\n" +
            //"你需要根据笔记内容生成markdown形式思维导图，加粗‘阿根廷’字样，数字用红色字体。\n" +
            "给出的笔记是：\n";

    static String s1 = "接下来我会给出我的笔记，你需要缩写我的笔记，只留下关键信息。\n" +
            "同时你需要将其中的最重要的那些信息进行加粗，最终输出为markdown格式。最后只需要输出markdown。\n" +
            //"你需要扩写笔记内容，输出为markdown格式，markdown笔记格式丰富一些，多进行字体加粗、字体色彩、分段等。\n" +
            //"然后你需要根据续写的笔记内容生成思维导图，也输出为markdown格式，\n" +
            //"你需要根据笔记内容生成markdown形式思维导图，加粗‘阿根廷’字样，数字用红色字体。\n" +
            "给出的笔记是：\n";

    static String s2 = "现年52岁的米莱，经济学家出身，是阿根廷“自由前进党”的创建者和主要领导人。\n" +
            "此次阿根廷总统选举得到外界普遍关注，其中一个重要原因是极端右翼政客米莱的参选。由于阿根廷通货膨胀率已经达到142.7%，且该国多年来经济增长严重放缓，米莱主张全面美元化。据参考消息8月15日报道，米莱的竞选承诺是要“炸掉”阿根廷央行，还提议大幅削减税收和公共开支。\n" +
            "此外，米莱所引发的争议还在于他支持器官买卖合法化，实行宽松的枪支管制政策，禁止堕胎合法化。因为与美国前总统特朗普有一些共同点，比如酷爱社交媒体，经常语出惊人等，米莱被一些媒体称为“阿根廷特朗普”。\n" +
            "据央视财经报道，目前，阿根廷货币贬值，通胀高企，极大地推高了当地的物价水平。为缓解生活成本压力，阿根廷民众也开始寻找一些节省开支的办法，以物换物市场再度受到青睐。据了解，阿根廷正面临严重的通胀压力。当地时间13日，阿根廷政府公布的10月通胀率达到8.3%，过去12个月累计通胀率达142.7%，创32年来新高。阿根廷央行今年内6次加息，将基准利率上调至133%，以应对当前复杂的通胀形势。\n" ;

    static String s3 = "小木偶拥有了人类所有的表情后,很兴奋,整天对着镜子做表情";

    static String s4 = "# <center>Chapter3  Spring Core</center>\n" +
            "## 1. Introduction to Spring\n" +
            "+ Spring Ecosphere\n" +
            "1. Spring Framework(the core framework,the basis)\n" +
            "2. SpringBoot(重点，简化开发)\n" +
            "3. SpringCloud\n" +
            "+ **Architecture of Spring**\n" +
            "\n" +
            "\n" +
            "## 2. Spring IOC（控制反转）\n" +
            "+ Tight-couple programming（紧耦合式的编程）\n" +
            "面向对象原则之————开闭原则（对于功能扩展开放，对于代码修改封闭）\n" +
            "+ Loose-coupled programming（松耦合）<br>\n" +
            "在类之外，使用其他方式为对象赋值（例如上图中的setBookDao()方法）\n" +
            "\n" +
            "+ IOC（控制反转）\n" +
            "\n" +
            "## 3. Spring\n" +
            "+ create a Spring project with Maven\n" +
            "\n" +
            "\n" +
            "## 4. Lifecycle of Beans\n" +
            "1. Scope of Beans\n" +
            "  + scope=\"singleton\"(default)（一般用这种）\n" +
            "  + scope=\"prototype\"\n" +
            "2. Instantiation with Factory（使用工厂进行实例化）\n" +
            "3. init-method and destroy-method\n" +
            "init-method：初始化bean时的操作\n" +
            "destroy-method：bean被销毁前的操作\n" +
            "4. Initializing and DisposableBean\n" +
            "\n" +
            "\n" +
            "## 5. Dependency Injection\n" +
            "1. Dependency Injection with Setter\n" +
            "常用的方式，设置set方法，使用setter注入\n" +
            "2. Dependency Injection with Constructor\n" +
            "3. Injection for Collections\n" +
            "4. Autowired Injection By Type\n" +
            "5. Autowired Injection By Name\n" +
            "\n" +
            "## 6. IOC Containers\n" +
            "\n" +
            "\n" +
            "## 7. Spring Annotations\n" +
            "+ Spring with annotations<br>\n" +
            "@Component 之后若无参数，则默认将其下的类名为bean的id";

    static String s5 = "21日晚8点，国足将在世预赛36强赛主场迎战韩国队。\n" +
            "19日上午，韩国队从仁川国际机场出发，经过三个多小时的飞行，于中午11点落地深圳宝安机场。20日下午3点，韩国队主教练克林斯曼和后卫金玟哉一起出席了赛前新闻发布会。\n" +
            "对于本场和中国队的比赛，克林斯曼表示，“很高兴来到中国，很兴奋迎来和中国队的比赛。我们知道这是一场艰难的较量，希望球队可以延续上一场（5比0击败新加坡）的表现。我们做好了准备，目前一切都很完美。”\n" +
            "曾经在中超北京国安效力的金玟哉表示，“距离我上一场来中国已经过去很久了，如教练所说，在中国对阵中国队不会容易，但希望可以拿到3分，我们球队做好了准备。”\n" +
            "对于是否会和队友分享一些中国队的信息，金玟哉说，“明天比赛球队的目标是不丢球，建立稳固的防守最差结果也是拿1分，首先要零封对手，这是目标。”";

    static String s6 =  "# <center>Chapter3  Spring Core</center>\n" +
            "## 1. Introduction to Spring\n" +
            "1. Spring Framework(the core framework,the basis)\n" +
            "2. SpringBoot(重点，简化开发)\n" +
            "3. SpringCloud\n" +
            "\n" +
            "## 2. Spring IOC（控制反转）\n" +
            "\n" +
            "## 3. Spring\n" +
            "\n" +
            "## 4. Lifecycle of Beans\n" +
            "1. Scope of Beans\n" +
            "2. Instantiation with Factory（使用工厂进行实例化）\n" +
            "3. init-method and destroy-method\n" +
            "4. Initializing and DisposableBean\n" +
            "\n" +
            "## 5. Dependency Injection\n" +
            "1. Dependency Injection with Setter\n" +
            "2. Dependency Injection with Constructor\n" +
            "3. Injection for Collections\n" +
            "4. Autowired Injection By Type\n" +
            "5. Autowired Injection By Name\n" +
            "\n" +
            "## 6. IOC Containers\n" +
            "\n" +
            "## 7. Spring Annotations\n";

    static String s7 = "Spring boot;" + "Spring Core;" + "Maven";

    static String s8 = "接下来我会给出一篇笔记，你需要根据这篇笔记的内容回答我接下来的多个问题。这篇笔记为：";

    @Autowired
    OcrService ocrService;


    public static void quickStart() throws ApiException, NoApiKeyException, InputRequiredException {

        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        Conversation conversation = new Conversation();
        String prompt = s1 + s5;
        ConversationParam param = ConversationParam
                .builder()
                .model("qwen-max")
                .prompt(prompt)
                .build();
        ConversationResult result = conversation.call(param);
        System.out.println(result.getOutput().getText());
    }

    public static void qwenQuickStart()
            throws NoApiKeyException, ApiException, InputRequiredException {
        String PROMPT = s0 + s4;
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        Generation gen = new Generation();
        QwenParam param = QwenParam.builder().model("qwen-max").prompt(PROMPT)
                .topP(0.8).build();
        GenerationResult result = gen.call(param);
        System.out.println(result.getOutput().getText());
    }

    public static void callWithMessage()
            throws NoApiKeyException, ApiException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        String prompt = s1 + s5;
        Generation gen = new Generation();
        MessageManager msgManager = new MessageManager(10);
        Message systemMsg =
                Message.builder().role(Role.SYSTEM.getValue()).content("You are a helpful assistant.").build();
        Message userMsg = Message.builder().role(Role.USER.getValue()).content(prompt).build();
        msgManager.add(systemMsg);
        msgManager.add(userMsg);
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(msgManager.get())
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .enableSearch(true)
                        .build();
        GenerationResult result = gen.call(param);
        System.out.println(result.getOutput().getChoices().get(0).getMessage().getContent());
    }

    public static void streamCallWithMessage()
            throws NoApiKeyException, ApiException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        String prompt = s1 + s5;
        Generation gen = new Generation();
        Message userMsg = Message
                .builder()
                .role(Role.USER.getValue())
                .content(prompt)
                .build();
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(Arrays.asList(userMsg))
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .enableSearch(true)
                        .incrementalOutput(true) // get streaming output incrementally
                        .build();
        Flowable<GenerationResult> result = gen.streamCall(param);
        StringBuilder fullContent = new StringBuilder();
        result.blockingForEach(message -> {
            fullContent.append(message.getOutput().getChoices().get(0).getMessage().getContent());
            System.out.println(message.getOutput().getChoices().get(0).getMessage().getContent());
        });
        System.out.println("Full content: \n" + fullContent.toString());
    }

    public static void NotOneConversationsTest(String question)
            throws NoApiKeyException, ApiException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        String prompt = s8 + s5;
        Generation gen = new Generation();
        MessageManager msgManager = new MessageManager(10);
        Message systemMsg =
                Message.builder().role(Role.SYSTEM.getValue()).content("你是智能助手机器人。").build();
        Message userMsg = Message.builder().role(Role.USER.getValue()).content(prompt).build();
        msgManager.add(systemMsg);
        msgManager.add(userMsg);
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(msgManager.get())
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .enableSearch(false)    //只让其根据笔记内容回答问题，不可通过其他渠道进行搜索
                        .build();
        GenerationResult result = gen.call(param);
        //System.out.println(result);
        msgManager.add(result);
        //System.out.println(result.getOutput().getChoices().get(0).getMessage().getContent());
        param.setPrompt(question);
        param.setMessages(msgManager.get());
        result = gen.call(param);
        //System.out.println(result);
        System.out.println(result.getOutput().getChoices().get(0).getMessage().getContent());
    }

    public static void NotOneConversationsTest2(String question)
            throws NoApiKeyException, ApiException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        String prompt = s8 + s5 + question;
        Generation gen = new Generation();
        MessageManager msgManager = new MessageManager(10);
        Message systemMsg =
                Message.builder().role(Role.SYSTEM.getValue()).content("你是智能助手机器人。").build();
        Message userMsg = Message.builder().role(Role.USER.getValue()).content(prompt).build();
        msgManager.add(systemMsg);
        msgManager.add(userMsg);
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(msgManager.get())
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .enableSearch(false)    //只让其根据笔记内容回答问题，不可通过其他渠道进行搜索
                        .build();
        GenerationResult result = gen.call(param);
        System.out.println(result.getOutput().getChoices().get(0).getMessage().getContent());
    }


    public static void main(String[] args) throws NoApiKeyException, InputRequiredException {
        try {
            AIFunctionService aiFunctionService = new AIFunctionService();
            //aiFunctionService.abstractNote(s5);
            //aiFunctionService.expandNote(s6);
            //aiFunctionService.generateNote(s7, 2000);
            //aiFunctionService.segmentNote(s5);
            //aiFunctionService.generateTable(s2);
            //aiFunctionService.generateFlowChart(s2);
            //callWithMessage();
            //qwenQuickStart();
            QAndAService qAndAService = new QAndAService();
            qAndAService.init2(s2);
            qAndAService.answerNew("米莱的政策是什么");
            //NotOneConversationsTest2("韩国这次的核心人物是谁");
            //NotOneConversationsTest2("韩国的教练是谁");
            //NotOneConversationsTest2("中国队的教练是谁");
            //NotOneConversationsTest2("重新回答我的上一个问题");
            //Generation gen = new Generation();
            //qAndAService.init(s2);
            //qAndAService.answer("阿根廷总统选举的重要人物是谁");
            //qAndAService.answer("阿根廷总统选举的关键人物是谁");
            //qAndAService.answer("阿根廷的新总统是谁");

        } catch (ApiException | IOException e) {
            System.out.println(String.format("Exception %s", e.getMessage()));
        }
        System.exit(0);
    }
}
