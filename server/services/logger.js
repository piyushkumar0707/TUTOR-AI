function formatMeta(meta) {
  if (!meta || typeof meta !== 'object') return '';
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' [meta_unserializable]';
  }
}

function log(level, message, meta) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`;

  if (level === 'error' || level === 'fatal') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  fatal: (message, meta) => log('fatal', message, meta),
};