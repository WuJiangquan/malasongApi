let {getSocketsInRoom} = require("./utile")

module.exports = class Guo{
   constructor(roomEventEmiter,roomId){
        this.isBump = false;
        let {sockets,firtSocket} = getSocketsInRoom(roomEventEmiter,roomId);
        this.sockets = sockets;
        this.firtSocket = firtSocket;
        this.roomEventEmiter;
   }

    doCheckTouchBan(socket,firtSocket){
        // if(!socket.ban){
        //     return false;
        // }
        // var seq1 = Math.abs(socket.ban.x * socket.direction - firtSocket.guo.x);
		// var seq2 = Math.abs(socket.ban.y * socket.direction - firtSocket.guo.y);
		// var seq3 = Math.sqrt(seq1 * seq1 + seq2 * seq2);
		// var d = parseInt(firtSocket.guo.width / 2 + socket.ban.w / 2, 10);
		// if (parseInt(seq3) <= d) {
		// 	if (!this.isBump) {
		// 		this.isBump = true;
		// 		return true;
		// 	}
		// } else {
		// 	this.isBump = false;
		// }
        // return false;
        if(!socket.ban){
             return false;
        }
        var condition1 = Math.abs(firtSocket.guo.x - socket.ban.x* socket.direction ) < (firtSocket.guo.height/2 + socket.ban.w/2);
        var condtion2 =  firtSocket.guo.y>=0&&firtSocket.guo.y < socket.ban.y * socket.direction || firtSocket.guo.y<0 && firtSocket.guo.y > socket.ban.y * socket.direction ;
        var condition3 = Math.abs(firtSocket.guo.y - socket.ban.y* socket.direction ) < Math.abs(socket.ban.w / 2 + firtSocket.guo.height / 2)
        return condition1 && condtion2 && condition3;
    }
    //添加阀门控制
    checkInValve(socket,firtSocket){
        var bumping = false;
        if(socket.banBumping){
            if(!this.doCheckTouchBan(socket,firtSocket)){
                socket.banBumping = false;
            }
        }else{
            if(this.doCheckTouchBan(socket,firtSocket)){
                socket.banBumping = true;
                bumping = true;
            }
        }
        return bumping;
    }


    dealBump(sockets,firtSocket) {
        var touched = false;
        for(var i=0;i<sockets.length;i++){
            if(this.checkInValve(sockets[i],firtSocket)){
                firtSocket.guo.vx = sockets[i].ban.fx ? firtSocket.guo.vx + sockets[i].ban.fx * sockets[i].direction  : firtSocket.guo.vx * -1;
                firtSocket.guo.vy = sockets[i].ban.fy ? firtSocket.guo.vy + sockets[i].ban.fy * sockets[i].direction : firtSocket.guo.vy * -1;
                touched = true;
            }
        }
        return touched;
    }

   
    itSockets(sockets,callback){
        for(var i=0,len = sockets.length;i<len;i++){
            callback(sockets[i],i);
        }
    }

    reset(winSocket){
        let {sockets,firtSocket} = this;
        firtSocket.guo.y = 0;
        firtSocket.guo.x = 0;
        firtSocket.guo.vy = 0;
        firtSocket.guo.vx = 0;
    }

    move(roomEventEmiter,callback){
        var guoLocation = {}
        let {sockets,firtSocket} = this;
        // 处理碰撞
		if ( this.dealBump(sockets,firtSocket)) {
            this.isBump = false;
        }
        // 如果锅自己撞边，也反弹一下
        if (Math.abs(firtSocket.guo.y + firtSocket.guo.vy) >= firtSocket.extremeY && Math.abs(firtSocket.guo.x) > 3) {
            firtSocket.guo.vy *= -1;
        }
        if (Math.abs(firtSocket.guo.x + firtSocket.guo.vx) >= firtSocket.extremeX) {
            firtSocket.guo.vx *= -1;
        }
        // 摩擦力
        if (!(Math.abs(firtSocket.guo.vy) < 0.00002 && Math.abs(firtSocket.guo.vx) < 0.00002)) {
            firtSocket.guo.vy *= .98;
            firtSocket.guo.vx *= .98;
            firtSocket.guo.y += firtSocket.guo.vy;
            firtSocket.guo.x += firtSocket.guo.vx;
        }

        // 判断结束
        if (Math.abs(firtSocket.guo.x) < 100 && Math.abs(firtSocket.guo.y) > firtSocket.extremeY-firtSocket.guo.height*0.3) {
            var id = "";
            var winSocket = ""
            if(firtSocket.guo.y>0){
                winSocket = sockets[0]
            }else{
                winSocket = sockets[1]
            }
            callback(winSocket);
        }else{
            this.itSockets(sockets,((socket,i) => {
                guoLocation[socket.id] = {
                    x : firtSocket.guo.x * socket.direction,
                    y : firtSocket.guo.y * socket.direction
                }
            }))
            roomEventEmiter.emit("panMove",guoLocation);
        }
        callback = null;
    }
}