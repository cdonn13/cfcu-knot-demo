// Tiny server-sent-events bus. The frontend's webhook inspector and the mock
// Link UI both subscribe to /api/events; every webhook the app receives is
// broadcast here in real time.
const clients = new Set();
const history = [];
const HISTORY_LIMIT = 50;

export function sseHandler(req, res) {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  for (const event of history) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  clients.add(res);
  const keepalive = setInterval(() => res.write(": keepalive\n\n"), 25_000);
  req.on("close", () => {
    clearInterval(keepalive);
    clients.delete(res);
  });
}

export function broadcast(event, { store = true } = {}) {
  const enriched = { ...event, id: history.length + 1, at: new Date().toISOString() };
  if (store) {
    history.push(enriched);
    if (history.length > HISTORY_LIMIT) history.shift();
  }
  const frame = `data: ${JSON.stringify(enriched)}\n\n`;
  for (const res of clients) res.write(frame);
  return enriched;
}

export function clearHistory() {
  history.length = 0;
}
