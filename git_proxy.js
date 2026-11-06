import net from 'net';
import http from 'http';

const GITHUB_IP = '20.207.73.82';

const server = http.createServer((req, res) => {
  res.writeHead(404);
  res.end();
});

server.on('connect', (req, clientSocket, head) => {
  const serverSocket = net.connect(443, GITHUB_IP, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', () => clientSocket.end());
  clientSocket.on('error', () => serverSocket.end());
});

server.listen(8999, '127.0.0.1');
