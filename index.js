const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function(req, res){
    res.render('index.ejs');
});

var rooms = ['Team1', 'Team2'];
var usernames = {};

io.sockets.on('connection', function(socket){

    socket.on('addUser', function(username){
        socket.username = username;
        socket.room = 't1';
        usernames[username] = username;
        socket.join('t1');
        socket.emit('updateChat', username, ' has joined Team1');
        socket.emit('updateRooms', rooms, 'Team1');
    });

    socket.on('sendChat', function(data){
        io.sockets.in(socket.room).emit('updateChat', socket.username, data);
    });

    socket.on('switchRoom', function(newRoom){
        socket.leave(socket.room);
        socket.join(newRoom);
        socket.broadcast.to(socket.room).emit('updateChat', socket.username, ' has left the team');
        socket.room = newRoom;
        socket.emit('updateChat', socket.username, ' has joined ' + newRoom);
        socket.emit('updateRooms', rooms, newRoom);

    })

    socket.on('disconnect', function(username){
        delete usernames[socket.username];
        io.sockets.emit('updateUsers', usernames);
        io.emit('is-online', '<i>' + socket.username + ' left the chat </i>');
        socket.leave(socket.room);
    });


});

const server = http.listen(8080, function() {
    console.log('listening on *:8080');
});
