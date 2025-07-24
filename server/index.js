import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { config } from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";

config();

const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  return res.json({
    status: "All Good",
  });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    })
  );
  return res.json({
    message: "Uploaded",
  });
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function getAnswerFromGemini(userQuery, retrievedDocs) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const contextString = retrievedDocs
    .map((doc, i) => `Context ${i + 1}:\n${doc.pageContent || doc.content}`)
    .join("\n\n");

  const prompt = `
    You are a helpful assistant. Use the following context to answer the question.

    ${contextString}

    Question: ${userQuery}
    `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

app.get("/chat", async (req, res) => {
  // const userQuery = "What is atomic habits about?";
  const userQuery = req.query.message;

  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "Books",
    }
  );

  const retriever = vectorStore.asRetriever({ k: 3 });

  const result = await retriever.invoke(userQuery);

  // // Result in loop
  // for (let res of result) {
  //   console.log(res.pageContent);
  //   console.log(res.metadata);
  // }

  const answer = await getAnswerFromGemini(userQuery, result);

  res.json({
    question: userQuery,
    answer,
    results: result.map((res) => ({
      content: res.pageContent || res.content,
      metadata: res.metadata || {},
    })),
  });
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
