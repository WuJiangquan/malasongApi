var Room = require("./Room");
var index = 0;
direction = [1,-1];
module.exports = {
    rooms : [],
    createRoom(socketId){
        var room  = null;
        for(let i =0,len = this.rooms.length;i<len;i++){
            if(this.rooms[i].state === 0 && !this.rooms[i].joinedTheUser(socketId)){
                room = this.rooms[i];
            }
        }
        if(null === room){
            room = this.createNewRoom();
        }
        return room;
    },
    createNewRoom(){
        var room = new Room({index:++index});
        this.rooms.push(room);
        return room;
    },
    leaveOtherRoom(socket,currentRoomId){
        for(var i=0;i<this.rooms.length;i++){
            if(this.rooms[i].joinedTheUser(socketId) && this.rooms[i].socketId !== currentRoomId){
                socket.leave(this.rooms[i].socketId );
            }
        }
    },

    getRoomsById(roomId){
        for(var i=0;i<this.rooms.length;i++){
            if(this.rooms[i].id === roomId){
                return this.rooms[i]
            }
        }
        return null;
    },

    joinRoom(io,socket,user){
        var room = this.createRoom(socket.id);
        this.doJoinRoom(socket,room,user);
        return room;
    },


    cureentUserInfoInRoom(roomEmiter,roomId){
        var userInfos = {}
        for(var socketId in roomEmiter.sockets){
            if(roomId === roomEmiter.sockets[socketId].currentRoomId){
                var roleId = roomEmiter.sockets[socketId].role?roomEmiter.sockets[socketId].role.roleId : "";
                var roleName = roomEmiter.sockets[socketId].role?roomEmiter.sockets[socketId].role.roleName : ""
                userInfos[socketId] = {
                    userInfo : roomEmiter.sockets[socketId].user,
                    roleId,
                    roleName
                };
            }
        }
        return userInfos;
    },

    doJoinRoom(io,socket,room,user){
       
        socket.join(room.id);
        room.userSockets.push(socket.id);
        room.users.push(user);
        room.socketIds.push(socket.id);
        socket.direction = direction[(room.userSockets.length-1)%2] || 1;
        socket.joinIndex  = room.userSockets.length; 
        socket.currentRoomId = room.id;
        socket.room = room;
        socket.user = user;
        socket.emit("joinRoomSuccess",{
            id : room.id,
            users : this.cureentUserInfoInRoom(io.sockets.in(room.id),room.id),
            roomPlayerNum : room.users.length,
            again : socket.again || 0
        })
     
        io.sockets.in(room.id).emit("sbJoin",{
            socketId : socket.id,
            user
        })
    },

    joindById(io,socket,roomId,user){
        var room  = this.getRoomsById(roomId);
        if(room && room.users.length<2){
            this.doJoinRoom(io,socket,room,user);
            return room;
        }else{
            socket.emit("inviteFaile",{
                id : room.id
            })
        }
    },
    leaveOldRoom(socket){
        if(socket.currentRoomId){
            socket.leave(socket.currentRoomId)
        }
       
    }
}