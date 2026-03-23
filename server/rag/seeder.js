require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');

const docFiles = ['math.json', 'science.json', 'history.json', 'coding.json', 'english.json'];
const CHUNK_WORD_SIZE = 200;

if (process.env.NODE_ENV === 'production') {
  console.error('Seeder cannot run in production environment.');
  process.exit(1);
}

function splitIntoChunks(text, chunkSize = CHUNK_WORD_SIZE) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

function toChunkedDocuments(rawDocs) {
  const chunked = [];

  rawDocs.forEach((doc) => {
    const sourceTitle = doc.title;
    const chunks = splitIntoChunks(doc.content, CHUNK_WORD_SIZE);

    chunks.forEach((chunkContent, idx) => {
      chunked.push({
        topic: doc.topic,
        title: doc.title,
        sourceTitle,
        chunkIndex: idx + 1,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        content: chunkContent,
      });
    });
  });

  return chunked;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Document.deleteMany({});
  console.log('Cleared existing documents');

  for (const file of docFiles) {
    const filePath = path.join(__dirname, 'documents', file);
    const docs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const chunkedDocs = toChunkedDocuments(docs);
    await Document.insertMany(chunkedDocs);
    console.log(`Seeded ${chunkedDocs.length} chunks from ${file}`);
  }

  console.log('Seeding complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
