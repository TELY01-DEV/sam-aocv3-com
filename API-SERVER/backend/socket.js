module.exports = app => {
    var httpserver = app.listen(process.env.SOCKET_SERVER_PORT);
    
    var io = require('socket.io')(httpserver, {
        serveClient: true,
        cors: {
            origin: "*",
        }
    });
    
    console.log('SOCKET Listening on port ' + process.env.SOCKET_SERVER_PORT);
    var socketCount = 0;
    
    io.on("connection", (socket) => {
        console.log('Socket Connect');
        console.log('socketCount: '+ ++socketCount);
        socket.emit('data', 'socket connected id: '+socket.id);
        
        socket.on('room_join', function(data) {
            data = data.replace(/['"]+/g, '')
            socket.join(String(data));
            io.sockets.emit('data', 'room joined: '+String(data));
        })
        
        socket.on('room_leave', function(data) {
            data = data.replace(/['"]+/g, '')
            socket.leave(String(data));
        })
    
        socket.on('disconnect', function(data) {
            console.log('Socket Disconnect');
            console.log('socketCount: '+ --socketCount);
        });
    })

    return io;
}