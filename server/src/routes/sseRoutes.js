import { Router } from "express";

export const sseRouter = Router();
const clients = new Set();

export function notifyAllClients(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

sseRouter.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write("data: {\"type\":\"connected\"}\n\n");
  clients.add(res);

  req.on("close", () => {
    clients.delete(res);
  });
});
