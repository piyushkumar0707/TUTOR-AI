const express = require('express');
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const groq = require('../services/groqClient');
const retrieve = require('../rag/retriever');
const ChatHistory = require('../models/ChatHistory');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

const STREAM_TTL_MS = 2 * 60 * 1000;
const pendingStreams = new Map();

function cleanExpiredStreams() {
  const now = Date.now();
  for (const [streamId, value] of pendingStreams.entries()) {
    if (now - value.createdAt > STREAM_TTL_MS) {
      pendingStreams.delete(streamId);
    }
  }
}

function lastAssistantMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'assistant') return messages[i].content || '';
  }
  return '';
}

function looksLikeFollowUpPrompt(text) {
  return /follow-?up question/i.test(text || '');
}

function classifyReplyQuality(reply) {
  const text = (reply || '').trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);

  if (
    words.length <= 3
    || /don't know|dont know|not sure|idk|no idea|maybe/.test(lower)
  ) {
    return 'low';
  }

  const hasMathSignals = /[=^+\-*/]|sqrt|therefore|because|hypotenuse|triangle|formula|step/.test(lower);
  if (hasMathSignals && words.length >= 12) return 'high';
  if (words.length >= 7) return 'medium';
  return 'low';
}

function shiftDifficulty(currentDifficulty, replyQuality) {
  const currentIndex = Math.max(0, DIFFICULTY_LEVELS.indexOf(currentDifficulty));

  if (replyQuality === 'high') {
    return DIFFICULTY_LEVELS[Math.min(currentIndex + 1, DIFFICULTY_LEVELS.length - 1)];
  }
  if (replyQuality === 'medium') {
    if (currentDifficulty === 'easy') return 'medium';
    if (currentDifficulty === 'hard') return 'medium';
    return 'medium';
  }
  if (replyQuality === 'low') {
    return DIFFICULTY_LEVELS[Math.max(currentIndex - 1, 0)];
  }
  return DIFFICULTY_LEVELS[currentIndex];
}

async function prepareChatContext({ userId, message, topic, sessionId }) {
  let chat = null;
  if (sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      const err = new Error('Invalid session ID');
      err.statusCode = 400;
      throw err;
    }
    chat = await ChatHistory.findOne({ _id: sessionId, userId });
  }

  if (!chat) {
    chat = await ChatHistory.create({ userId, topic, followUpDifficulty: 'easy', messages: [] });
  }

  let followUpDifficulty = chat.followUpDifficulty || 'easy';
  const previousAssistant = lastAssistantMessage(chat.messages);

  if (looksLikeFollowUpPrompt(previousAssistant)) {
    const replyQuality = classifyReplyQuality(message);
    followUpDifficulty = shiftDifficulty(followUpDifficulty, replyQuality);
  }

  const ragContext = await retrieve(message.trim());

  const conversationMessages = chat.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return {
    chat,
    followUpDifficulty,
    conversationMessages,
    ragContext,
  };
}

function getCompletionPayload({ topic, followUpDifficulty, ragContext, conversationMessages, message, stream }) {
  return {
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are TutorAI, a precise tutoring assistant.
Selected topic: ${topic}.
Current follow-up difficulty target: ${followUpDifficulty}.

CRITICAL: You are in an active tutoring session. Use all previous conversation context (below) to inform your response. Maintain continuity and coherence with what has been discussed.

Rules:
- Answer ONLY about ${topic} - do not drift to unrelated subtopics.
- Reference previous discussion points when relevant.
- Use retrieved context only when directly relevant to the user's exact question.
- If user asks off-topic, briefly redirect them.
- Keep the response under 140 words.
- Format response with Direct Answer, Key Points (3 bullets), Example, and Follow-up.

Retrieved context:
${ragContext || '(No specific context found; use discussion history + general knowledge)'}`,
      },
      ...conversationMessages,
      { role: 'user', content: message },
    ],
    temperature: 0.35,
    max_tokens: 420,
    stream,
  };
}

router.post('/stream-init', authMiddleware, async (req, res) => {
  cleanExpiredStreams();

  const { message, topic = 'General', sessionId } = req.body;
  const userId = req.user.id;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const streamId = randomUUID();
  pendingStreams.set(streamId, {
    userId,
    message: message.trim(),
    topic,
    sessionId,
    createdAt: Date.now(),
  });

  return res.status(200).json({ streamId });
});

router.get('/stream/:streamId', authMiddleware, async (req, res) => {
  cleanExpiredStreams();

  const { streamId } = req.params;
  const payload = pendingStreams.get(streamId);

  if (!payload) {
    return res.status(404).json({ error: 'Stream not found or expired' });
  }

  if (payload.userId !== req.user.id) {
    pendingStreams.delete(streamId);
    return res.status(403).json({ error: 'Forbidden stream access' });
  }

  pendingStreams.delete(streamId);

  const { userId, message, topic, sessionId } = payload;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let clientClosed = false;
  req.on('close', () => {
    clientClosed = true;
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const prepared = await prepareChatContext({ userId, message, topic, sessionId });

    const completion = await groq.chat.completions.create(
      getCompletionPayload({
        topic,
        followUpDifficulty: prepared.followUpDifficulty,
        ragContext: prepared.ragContext,
        conversationMessages: prepared.conversationMessages,
        message,
        stream: true,
      }),
    );

    let fullResponse = '';

    for await (const chunk of completion) {
      if (clientClosed) return;

      const piece = chunk?.choices?.[0]?.delta?.content || '';
      if (!piece) continue;

      fullResponse += piece;
      sendEvent('chunk', { content: piece });
    }

    if (clientClosed) return;

    const finalResponse = fullResponse.trim() || 'I could not generate a response.';

    prepared.chat.topic = topic;
    prepared.chat.followUpDifficulty = prepared.followUpDifficulty;
    prepared.chat.messages.push({ role: 'user', content: message });
    prepared.chat.messages.push({ role: 'assistant', content: finalResponse });
    await prepared.chat.save();

    sendEvent('done', {
      sessionId: prepared.chat._id,
      followUpDifficulty: prepared.followUpDifficulty,
    });
    res.end();
  } catch (err) {
    if (!clientClosed) {
      sendEvent('error', { error: 'Chat streaming failed' });
      res.end();
    }
    console.error('Chat stream error:', err);
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { message, topic = 'General', sessionId } = req.body;
  const userId = req.user.id;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const prepared = await prepareChatContext({
      userId,
      message: message.trim(),
      topic,
      sessionId,
    });

    const completion = await groq.chat.completions.create(
      getCompletionPayload({
        topic,
        followUpDifficulty: prepared.followUpDifficulty,
        ragContext: prepared.ragContext,
        conversationMessages: prepared.conversationMessages,
        message: message.trim(),
        stream: false,
      }),
    );

    const aiResponse = completion.choices?.[0]?.message?.content?.trim() || 'I could not generate a response.';

    prepared.chat.topic = topic;
    prepared.chat.followUpDifficulty = prepared.followUpDifficulty;
    prepared.chat.messages.push({ role: 'user', content: message.trim() });
    prepared.chat.messages.push({ role: 'assistant', content: aiResponse });
    await prepared.chat.save();

    return res.status(200).json({
      response: aiResponse,
      sessionId: prepared.chat._id,
      followUpDifficulty: prepared.followUpDifficulty,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode === 400) {
      return res.status(400).json({ error: err.message || 'Invalid request' });
    }
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Chat failed' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user.id })
      .select('topic createdAt _id')
      .sort({ createdAt: -1 });

    return res.status(200).json(sessions);
  } catch (err) {
    console.error('Chat history error:', err);
    return res.status(500).json({ error: 'Failed to load chat history' });
  }
});

router.get('/history/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const chat = await ChatHistory.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(chat);
  } catch (err) {
    console.error('Chat session error:', err);
    return res.status(500).json({ error: 'Failed to load session' });
  }
});

module.exports = router;
