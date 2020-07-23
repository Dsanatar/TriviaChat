const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function(req, res){
    res.render('index.ejs');
});

var rooms = ['Team1', 'Team2'];
var usernames = {};

var ansList = {};

io.sockets.on('connection', function(socket){

    socket.on('addUser', function(username){
        socket.username = username;
        socket.room = 'Team1';
        usernames[username] = username;
        socket.join('Team1');
        socket.emit('updateChat', username, ' has joined Team1');
        socket.broadcast.to('Team1').emit('updateChat', username, ' has joined Team1');
        socket.emit('updateRooms', rooms, 'Team1');
    });

    socket.on('sendChat', function(data){
        io.sockets.in(socket.room).emit('updateChat', socket.username, data);
    });

    socket.on('sendScoreTo2', function(data){
        socket.to('Team1').emit('updateScore', data);
        io.sockets.in(socket.room).emit('updateScore', data);
    });

    socket.on('sendScoreTo1', function(data){
        socket.to('Team1').emit('updateScore', data);
        io.sockets.in(socket.room).emit('updateScore', data);
    });

    socket.on('submitAns', function(data){
        ansList[socket.room] = data;
        console.log(ansList)
        if(Object.keys(ansList).length == 2){
            switch (socket.room) {
                case 'Team1':
                    socket.to('Team2').emit('updateAns', ansList);
                    io.sockets.in(socket.room).emit('updateAns', ansList);
                    ansList = {};
                    break;
                case 'Team2':
                    socket.to('Team1').emit('updateAns', ansList);
                    io.sockets.in(socket.room).emit('updateAns', ansList);
                    ansList = {};
                    break;
            
                default:
                    break;
            }
        }
    })


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
        socket.broadcast.emit('updateChat', socket.username, ' has disconnected');
        socket.leave(socket.room);
    });


});

const server = http.listen(8080, function() {
    console.log('listening on *:8080');
});
