import { Worker } from "bullmq";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantClient } from "@qdrant/js-client-rest";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { v4 as uuidv4 } from "uuid"; // ✅ Import UUID

import { config } from "dotenv";
config();

const COLLECTION_NAME = "Books";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log("Processing job:", job.data);
    const data = JSON.parse(job.data);

    try {
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();

      const textSplitter = new CharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 0,
      });
      const texts = await textSplitter.splitDocuments(docs);

      console.log(`📄 First Chunk Content:\n${texts[0].pageContent}`);
      console.log(`📄 Metadata: ${JSON.stringify(texts[0].metadata)}\n`);

      const qclient = new QdrantClient({
        url: process.env.QDRANT_URL || "http://localhost:6333",
      });

      const embeddings = new HuggingFaceTransformersEmbeddings({
        modelName: "Xenova/all-MiniLM-L6-v2",
      });

      // ✅ Ensure collection exists
      const collections = await qclient.getCollections();
      const collectionExists = collections.collections.some(
        (col) => col.name === COLLECTION_NAME
      );

      if (!collectionExists) {
        await qclient.createCollection(COLLECTION_NAME, {
          vectors: {
            size: 384,
            distance: "Cosine",
          },
        });
        console.log("✅ Collection created.");
      } else {
        console.log("ℹ️ Collection already exists.");
      }

      // ✅ Embed & store
      const points = [];

      for (let i = 0; i < texts.length; i++) {
        const content = texts[i].pageContent;
        const metadata = texts[i].metadata;

        try {
          const vector = await embeddings.embedQuery(content);
          points.push({
            id: uuidv4(),
            vector,
            payload: {
              content,
              metadata: {
                ...metadata,
                bookName: data.filename, // 📌 Tag with the uploaded book file name
              },
            },
          });
        } catch (err) {
          console.error(`❌ Embedding failed for chunk ${i}:`, err.message);
        }
      }

      if (points.length > 0) {
        await qclient.upsert(COLLECTION_NAME, {
          points,
        });
        console.log(
          `✅ ${points.length} vectors successfully added to Qdrant.`
        );
      } else {
        console.log("⚠️ No vectors to upsert.");
      }
    } catch (err) {
      console.error("❌ Error processing job:", err);
    }
  },
  {
    concurrency: 1,
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

// import { Worker } from "bullmq";

// import { OpenAIEmbeddings } from "@langchain/openai";
// import { QdrantVectorStore } from "@langchain/qdrant";
// import { Document } from "@langchain/core/documents";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { CharacterTextSplitter } from "@langchain/textsplitters";
// import { QdrantClient } from "@qdrant/js-client-rest";

// import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";

// import { config } from "dotenv";

// config();

// const worker = new Worker(
//   "file-upload-queue",
//   async (job) => {
//     console.log("Processing job:", job.data);
//     const data = JSON.parse(job.data);
//     try {
//       /*
//     Path: data.path
//     read the pdf form path,
//     chunk the pdf,
//     call the openai embedding model for every chunk,
//     store the chunk in qdrant db
//     */

//       // Load the PDF document
//       const loader = new PDFLoader(data.path);
//       const docs = await loader.load();

//       // Chunk the document
//       const textSplitter = new CharacterTextSplitter({
//         chunkSize: 300,
//         chunkOverlap: 0,
//       });
//       const texts = await textSplitter.splitDocuments(docs);
//       //printing page conentnt and metadata of first text chunk
//       console.log(`Page Content: ${texts[0].pageContent}`);
//       console.log(`Metadata: ${JSON.stringify(texts[0].metadata)}`);
//       // console.log(`Texts : ${texts[2].metadata}`);

//       // Create embeddings
//       const qclient = new QdrantClient({
//         url: process.env.QDRANT_URL,
//       });

//       // console.log(process.env.QDRANT_URL);
//       // console.log(process.env.OPENAI_API_KEY);
//       // const embeddings = new OpenAIEmbeddings({
//       //   apiKey: process.env.OPENAI_API_KEY,
//       //   model: "text-embedding-3-small",
//       // });

//       const embeddings = new HuggingFaceTransformersEmbeddings({
//         modelName: "Xenova/all-MiniLM-L6-v2", // Local model
//       });

//       const vectorStore = await QdrantVectorStore.fromTexts(
//         texts.map((doc) => doc.pageContent),
//         texts.map((doc) => doc.metadata),
//         embeddings,
//         {
//           client: qclient,
//           collectionName: "pdf-embeddings",
//         }
//       );

//       console.log("✅ Vectors successfully added to Qdrant.");

//       const collections = await qclient.getCollections();
//       console.log(`Collections: ${JSON.stringify(collections)}`);
//       // await vectorStore.addDocuments(texts);
//     } catch (err) {
//       console.error("❌ Error processing job:", err);
//     }
//   },
//   {
//     concurrency: 1,
//     connection: {
//       host: "localhost",
//       port: 6379,
//     },
//   }
// );
