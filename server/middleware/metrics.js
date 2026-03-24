const MAX_SAMPLES = 1000;

const state = {
  startedAt: Date.now(),
  requestsTotal: 0,
  statusCounts: {},
  routeCounts: {},
  latencyMsSamples: [],
};

function recordLatency(durationMs) {
  state.latencyMsSamples.push(durationMs);
  if (state.latencyMsSamples.length > MAX_SAMPLES) {
    state.latencyMsSamples.shift();
  }
}

function getPercentile(sortedValues, percentile) {
  if (!sortedValues.length) return 0;
  const idx = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, idx)];
}

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const statusKey = String(res.statusCode);
    const routeKey = `${req.method} ${req.baseUrl || ''}${req.path || ''}`.trim();

    state.requestsTotal += 1;
    state.statusCounts[statusKey] = (state.statusCounts[statusKey] || 0) + 1;
    state.routeCounts[routeKey] = (state.routeCounts[routeKey] || 0) + 1;
    recordLatency(durationMs);
  });

  next();
}

function getMetricsSnapshot() {
  const sorted = [...state.latencyMsSamples].sort((a, b) => a - b);
  const total = state.requestsTotal || 1;
  const errorCount = Object.entries(state.statusCounts)
    .filter(([code]) => Number(code) >= 500)
    .reduce((acc, [, count]) => acc + count, 0);

  return {
    uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
    requestsTotal: state.requestsTotal,
    statusCounts: state.statusCounts,
    topRoutes: Object.entries(state.routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([route, count]) => ({ route, count })),
    latencyMs: {
      p50: Number(getPercentile(sorted, 50).toFixed(2)),
      p95: Number(getPercentile(sorted, 95).toFixed(2)),
      max: Number((sorted[sorted.length - 1] || 0).toFixed(2)),
      samples: sorted.length,
    },
    errorRate5xx: Number(((errorCount / total) * 100).toFixed(2)),
  };
}

module.exports = {
  metricsMiddleware,
  getMetricsSnapshot,
};