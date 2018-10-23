module.exports = {
    getSocketsInRoom(roomEventEmiter,roomId){
        var sockets = [];
        var firtSocket = null;
        for(var id in roomEventEmiter.sockets){
            var socket = roomEventEmiter.sockets[id];
            if(socket.currentRoomId === roomId){
                sockets.push(socket);
                if(socket.direction===1){
                    firtSocket = socket;
                }
            }
            socket = null; // 释放内存
        }
        return {
            sockets,
            firtSocket
        };
    }

}