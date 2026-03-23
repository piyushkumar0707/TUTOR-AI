const express = require('express');
const mongoose = require('mongoose');
const groq = require('../services/groqClient');
const retrieve = require('../rag/retriever');
const ChatHistory = require('../models/ChatHistory');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

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

router.post('/', authMiddleware, async (req, res) => {
  const { message, topic = 'General', sessionId } = req.body;
  const userId = req.user.id;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    let chat = null;
    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ error: 'Invalid session ID' });
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

    const retrievalQuery = message.trim();
    const ragContext = await retrieve(retrievalQuery);

    // Build conversation messages from chat history (if any)
    const conversationMessages = chat.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are TutorAI, a precise tutoring assistant.
Selected topic: ${topic}.
Current follow-up difficulty target: ${followUpDifficulty}.

CRITICAL: You are in an active tutoring session. Use all previous conversation context (below) to inform your response. Maintain continuity and coherence with what has been discussed.

Rules:
- Answer ONLY about ${topic} — do not drift to unrelated subtopics.
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
    });

    const aiResponse = completion.choices?.[0]?.message?.content?.trim() || 'I could not generate a response.';

    chat.topic = topic;
    chat.followUpDifficulty = followUpDifficulty;

    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    return res.status(200).json({ response: aiResponse, sessionId: chat._id, followUpDifficulty });
  } catch (err) {
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
