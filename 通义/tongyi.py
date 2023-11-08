import os
import openai
from langchain.llms import Tongyi
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import requests

prompt_text = """
接下来我会给出我的笔记，笔记中每段文字开头的数字时该段文字的段落号，你需要帮助我整理我的笔记，
你需要将笔记分成若干个部分，并给每个部分取一个小标题，你的回答需要按照json格式，键为'result'，
值为一个列表，列表中包含若干个json对象，每个对象包括键'paragraphs'和'title'，
其中paragraphs说明该部分由第几段落到第几段落组成，title则是你给出的小标题，你只需要返回json结果。
给出的笔记是:
{note}
"""

note_text = """
1 H：色相，颜色的样子
2 S：饱和度，颜色的纯度
3 B：明度，颜色的明亮程度

4 纯色调：
优点：刺激/直接/活力/促销
缺点：廉价/缺少品质感
例子：超市传单
饱和度和纯度数值较高，处于色板的右上部分

5 明色调：
优点：年轻/阳光/活力/明朗/干净
缺点：缺少档次
用于耐用消费品、大众化产品的宣传
饱和度相比纯色调稍低，处于色板中上部分

6 淡色调：
优点：天真/女性/纤细/轻快/高档
缺点：单薄/软弱
用于女装、女性消费品、化妆品宣传
高明度、低饱和度，位于色板左上部分

7 白色调：
优点：文艺/素雅/简洁/干净/高档
缺点：无趣/单调/缺乏个性
无限偏向白色，位于色板最左上方

8 暗色调：
优点：品质/历史/力量/厚重/古典/地位
缺点：压抑/阴暗/危险

9 灰色调：
优点：成熟/稳重/优雅/文艺
缺点：脏
位于色板中间位置

10 六大平衡平面设计基本目的：突出主体和文字
色调平衡/深浅平衡一个画面中不会只有一种色调，需要有两种以上的色调来平衡不同色调的优点和缺点，比如背景采用纯色调时文字可以采用灰色调来中和纯色调的廉价感，但不能用白色调或者暗色调因为颜色是有重量的，白色最轻而黑色最重，背景和主题的颜色都轻的话无法形成对比，失去层次感

11 冷暖平衡平衡色彩给受众带来的情感失衡，不能过冷也不能过热

12 互补平衡：平衡色彩刺激带来的心理失衡，也叫生理补色，眼睛受到一种色彩刺激后，心里会产生平衡这种色彩的渴望，而这种平衡，需要通过所见颜色的互补色来完成，互补色中的一种颜色孤立出现会带来心理失衡，当平衡色同时出现时，可以突出两者各自优势

13 花色和纯色的平衡当背景色很花或者没有规则时，需要使用纯色来平衡

14 有彩色和无彩色的平衡打破单调配色，突出主体和文字

15 面积平衡让画面透气，有层次，俗称的主色、辅助色、点缀色主色70％，辅助色25％，点缀色5％
"""


def t_Tongyi():
    llm = Tongyi()
    prompt = PromptTemplate(
        input_variables=["note"],
        template="""
        接下来我会给出我的笔记，笔记中每段文字开头的数字时该段文字的段落号，你需要帮助我整理我的笔记，
        你需要将笔记分成若干个部分，并给每个部分取一个小标题，你的回答需要按照json格式，键为'result'，
        值为一个列表，列表中包含若干个json对象，每个对象包括键'paragraphs'和'title'，
        其中paragraphs说明该部分由第几段落到第几段落组成，title则是你给出的小标题，你只需要返回json结果。
        给出的笔记是:
        {note}
        """,
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    result = chain.run(note_text)
    print(result)
    pass


def httpAPI():
    url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + os.getenv("DASHSCOPE_API_KEY")
    }
    prompt = PromptTemplate(
        input_variables=["note"],
        template=prompt_text
    )
    data = {
        'model': 'qwen-turbo',
        'input': {
            'prompt': prompt.format(note=note_text)
        }
    }
    response = requests.post(url=url, headers=headers, json=data).json()
    print(response)
    pass


if __name__ == "__main__":
    # t_Tongyi()
    httpAPI()
