const TCP_PORT = 6000;

const net = require('net');
const connectedSockets = new Set();
var connectionCount = 0;

let data = require('./database/data.js');

function IsJsonString(str) {
  return new Promise ((resolve, reject) =>{
    try {
      JSON.parse(str);
      resolve(true);
    } catch (e) {
      reject(e);
    }
  })
}

// Create a server object
const server = net.createServer((socket) => {
  console.clear();
  console.log('connectionCount: '+ ++connectionCount);

  // socket.write('SERVER: Hello! This is server speaking.');
  connectedSockets.add(socket);

  var chunk = "";

  socket.on('data', (data) => {
    var dataStr = data.toString();

    IsJsonString(dataStr).then(res => {
      data.insert(dataStr);
    }).catch(error => { 
      chunk += dataStr;
      d_index = chunk.indexOf('\n');
      while (d_index > -1) {         
        try {
          string = chunk.substring(0, d_index);
          data.insert(string);
        } catch (e) {
          console.log('Invalid Json', dataStr);
        }
        chunk = chunk.substring(d_index+1);
        d_index = chunk.indexOf('\n');
      }
    })
  });
  
  // socket.end('SERVER: Closing connection now.<br>');
  socket.on('end', function() {
    console.log('Socket Disconnect: ');
    connectedSockets.delete(socket);
    console.log('connectionCount: '+ --connectionCount);
  });
}).on('error', (err) => {
  console.error(err);
});

connectedSockets.broadcast = function(data) {
  for (let socket of this) {
    console.log(socket.id, data);
    socket.write(data);
  }
}

// Open server on port
server.listen(TCP_PORT, () => {
  console.log('opened server on', server.address().port);
});

exports.EventEmitter = function (data) {
  connectedSockets.broadcast(data);
}