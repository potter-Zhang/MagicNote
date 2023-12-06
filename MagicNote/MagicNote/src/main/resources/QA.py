import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
os.environ["OPENAI_API_KEY"] = "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"

from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI

with open('D:\\在武大\\大三上\\JavaEE\\大作业\\java-ee-proj\\MagicNote\\MagicNote\\src\\main\\resources\\test.txt',encoding='utf-8') as f:
    state_of_the_union = f.read()
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
texts = text_splitter.split_text(state_of_the_union)

embeddings = OpenAIEmbeddings()

chroma1 = Chroma.from_texts(texts, embeddings,
                              metadatas=[{"source": str(i)} for i in range(len(texts))])

index_count = chroma1._collection.count()
if index_count <= 3:
    docsearch = chroma1.as_retriever(search_kwargs={"k": index_count})
else:
    docsearch = chroma1.as_retriever()


query = sys.argv[1]
docs = docsearch.get_relevant_documents(query)

from langchain.chains.question_answering import load_qa_chain

chain = load_qa_chain(ChatOpenAI(model_name="gpt-3.5-turbo-1106"), chain_type="stuff")
print(chain({"input_documents": docs, "question": query}).get('output_text'))