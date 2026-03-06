import http from 'http';
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><html><head><title>Hello</title></head><body><h1>Hello World</h1><p>Deployed via OpenClaw + Railway</p></body></html>');
});
server.listen(port, () => console.log(`listening on ${port}`));
