import app from './app';
import http from 'http';

const port = process.env.PORT || 3000;
console.log(port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
function onError(error: any) {
  console.error(error);
}
function onListening() {
  console.log('Listening on ' + port);
}