const Document = require('../models/Document');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function retrieve(query) {
  if (!query || query.trim().length === 0) return '';

  try {
    const results = await Document.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' }, content: 1, title: 1, topic: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3);

    if (results.length > 0) return formatContext(results);

    const keywords = extractKeywords(query);
    if (keywords.length === 0) return '';

    const safePattern = keywords.map(escapeRegex).join('|');
    const regex = new RegExp(safePattern, 'i');
    const fallback = await Document.find({
      $or: [
        { content: regex },
        { title: regex },
        { tags: { $in: keywords } },
      ],
    }).limit(3);

    return fallback.length > 0 ? formatContext(fallback) : '';
  } catch (err) {
    console.error('RAG retrieval error:', err);
    return '';
  }
}

function formatContext(docs) {
  return docs
    .map((doc) => {
      const sourceTitle = doc.sourceTitle || doc.title;
      const chunkLabel = doc.chunkIndex ? ` (chunk ${doc.chunkIndex})` : '';
      return `[${doc.topic} - ${sourceTitle}${chunkLabel}]\n${doc.content}`;
    })
    .join('\n\n---\n\n');
}

function extractKeywords(query) {
  const stopWords = new Set(['what', 'is', 'are', 'how', 'the', 'a', 'an', 'of', 'in', 'to', 'and', 'for', 'with']);

  return query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

module.exports = retrieve;
