var express = require('express'); 
var app = express();
let User =  require("./User"); 
const Game = require("./Game.js");
var server = require('http').createServer(app);
let Timmer = require("./Timmer");
const roles = require("./roles")
let {getSocketsInRoom} = require("./utile")
var io = require('socket.io')(server,{
    pingInterval: 1000  ,
    pingTimeout: 5000 * 60
});

var rooms = require("./rooms");

app.all("*",(req,res,next)=>{
    res.header("Access-Control-AllowOrigin","*");
    res.header("Access-Control-Headers","X-Request-With");
    res.header("Access-Control-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("content-type","*/*;charset=utf-8");
    next();
})

app.use('/', express.static(__dirname + '/public')); 

server.listen(8091,(res)=>{
    console.log("程序运行在localhost:8091")
});

/* 
    广播选择角色信息
    向整个房间广播 updateRole。 把房间所有用户的信息都广播出去。
        updateRole 广播参数： roomRoles／整个房间的角色信息 
        [{
            socketId : "",
            role : {
                roleId : 1,
                roleName : "运营"
            } || ""
        }]
    向当前链接用户同步对战对方的信息： updateOtherRole  
        updateOtherRole 参数 ： otherRole，对家的角色信息
        otherRole : {
                roleId : 1,
                roleName : "运营"
            } 

*/
let broadcastRoleInfo = function(roomEmiter,socket){
    const {
        roomRoles,
        otherRole
      } = roles.getAllRoleInRoom(roomEmiter,socket);
      roomEmiter.emit("updateRole",roomRoles);
      socket.emit("updateOtherRole",otherRole);
}


/* 
    准备倒计时结束
    结束时告诉房间所有人
*/
let readyCountDownEnd = function(roomEmiter,socket){
    roles.assignRandomRole(roomEmiter,socket.currentRoomId);
    const {
        roomRoles,
        otherRole
      } = roles.getAllRoleInRoom(roomEmiter,socket);
    roomEmiter.emit("readyEnd",{
        roles : roomRoles
    })
   
}

let gameEnd = function(roomEmiter,sockets){
    var winId = "";
    var winUser = "";
    if(sockets[0].score>sockets[1].score){
        winId = sockets[0].id;
        winUser = sockets[0].user;
    }
    if(sockets[1].score>sockets[0].score){
        winId = sockets[1].id;
        winUser = sockets[1].user;
    }
    roomEmiter.emit("gameFinish",{
        winId ,
        winUser ,
        score :{
            [sockets[0]] : sockets[0].score,
            [sockets[1]] : sockets[1].score,
        }
    })
}

let createRoom = function({user,roomId,io,socket}){
    var room = ""
    if(roomId){
        room = rooms.getRoomsById(roomId);
    }else{
        room = rooms.createNewRoom();
    }
    if(socket.currentRoomId){
        rooms.leaveOldRoom(socket)
    }
    rooms.joindById(io,socket,room.id,user);
    if(room.mathUserSuccess()){
        var roomEmiter = io.sockets.in(socket.currentRoomId)
        let {sockets} = getSocketsInRoom(roomEmiter,socket.currentRoomId);
        var userInfo = {};
        for(var i=0;i<sockets.length;i++){
            var id = sockets[i].id;
            userInfo[id] =  sockets[i].user;
        }
        io.sockets.in(room.id).emit("roomFull",userInfo)
    }
    return room;
}

//socket部分
io.on('connection', function(socket) {
    socket.emit("init",{
        socketId : socket.id
    })

     /*
        开局创建房间，邀请和被邀请的区别在于是否有出事的roomId
        参数  {
            user : 用户信息
            roomId : 被邀请的房间信息，如果是邀请的，则为空，为空的时候创建房间
        }
     */

   
     
    socket.on("createRoom", ({user,roomId}) => {
        let room = createRoom({user,roomId,io,socket});
        console.log("create room");
        console.log(user);
        console.log(user.nickName);
        console.log(room.id);
    })

    /*
        选择角色
        参数 roleId 为角色ID ,对应顺序
         var roles = [{
            roleId : 1,
            roleName : "运营"
        },{
            roleId : 2,
            roleName : "产品"
        },{
            roleId : 3,
            roleName : "美术"
        },{
            roleId : 4,
            roleName : "前端"
        },{
            roleId : 5,
            roleName : "后端"
        },{
            roleId : 6,
            roleName : "测试"
        }]
    */
    socket.on("selectRole",roleId => {
        var role = roles.map(roleId);
        socket.role = role;
        console.log(socket.id + "选择了橘色")

        console.log(roleId)
        broadcastRoleInfo(io.sockets.in(socket.currentRoomId),socket);
        socket.emit("sbChangeRole",{
            [socket.id] :  role
        });
    })

    socket.on("initGameParams",function(){
        socket.score = 0;
        socket.roundNum = 0;
    })

 
    /*
        准备按钮点击响应事件
    */
    socket.on("ready",() => {
        var readyTime = 5;
        var readyTimmer = new Timmer({
            totalTime : readyTime
        });
        var roomEmiter = io.sockets.in(socket.currentRoomId);
       
        // if(roomEmiter.readyCountingStart){
        //     readyTimmer.stop(()=>{
        //         readyCountDownEnd(roomEmiter,socket);
               
        //     })
        //     roomEmiter.readyCountingStart = false;
            
        // }else{
           
        // }
        roomEmiter.emit("readyCountStart");
        roomEmiter.emit("readyLessTime",readyTime);
        readyTimmer.start(()=>{
            var lessTime = readyTimmer.lessTime;
            roomEmiter.emit("readyLessTime",lessTime);
        },()=>{
            readyCountDownEnd(roomEmiter,socket);
        });
        roomEmiter.readyCountingStart = true;
    })


    socket.on("updateBanLocation",moveParam => {
        socket.ban = {
            fx: moveParam.vx,
			fy: moveParam.vy,
			x: moveParam.x,
			y: moveParam.y,
			w: moveParam.w,
			h: moveParam.h
        }
       
        if( socket.currentRoomId){
            io.sockets.in( socket.currentRoomId ).emit("updateBan",{
                socketId : socket.id,
                x : moveParam.x,
                y : moveParam.y
            })
        }
       
    })

    socket.on("gameStart",({extremeX,extremeY,guox,guoy,guoVx,guoVy,guoHeight,guoWidth})=>{
        socket.extremeX = extremeX;
        socket.extremeY = extremeY;
        socket.guo = {
           x : guox ,
           y : guoy,
           vx : guoVx ,
           vy : guoVy ,
           height : guoHeight,
           width : guoWidth
        }
        var {firtSocket} = getSocketsInRoom(io.sockets.in(socket.currentRoomId),socket.currentRoomId);
        if(firtSocket&&firtSocket.id !== socket.id){
            return ;
        }
        let timmer = new Timmer({
            totalTime : 30
        });
        let game = new Game(io.sockets.in(socket.currentRoomId),socket.currentRoomId);
        
        socket.roundNum++;
        game.lastRound = socket.roundNum;
        timmer.start(function(){
            game.move( io.sockets.in( socket.currentRoomId),function(winSocket){
                if(game.lastRound > socket.roundNum){
                    return ;
                }
                game.lastRound++
                var roomEmiter = io.sockets.in(socket.currentRoomId);
                var {sockets} = getSocketsInRoom(roomEmiter,socket.currentRoomId);
                winSocket.score++;
                if(socket.roundNum>=5){
                    gameEnd(roomEmiter,sockets);
                }else{
                    roomEmiter.emit("updateScore",{
                        winId : winSocket.id,
                        winUser : winSocket.user,
                        score :{
                            [sockets[0].id] : sockets[0].score,
                            [sockets[1].id] : sockets[1].score,
                        }
                    })
                }
                timmer.stop();
                game.reset(winSocket);
            });
            io.sockets.in(socket.currentRoomId).emit("updateGameTime", timmer.lessTime);
        },function(){
            var roomEmiter = io.sockets.in(socket.currentRoomId);
            var {sockets} = getSocketsInRoom(roomEmiter,socket.currentRoomId);
            if( socket.roundNum >= 5){
                gameEnd(roomEmiter,sockets);
            }else{
                roomEmiter.emit("gameDraw",{
                    score :{
                        [sockets[0]] : sockets[0].score,
                        [sockets[1]] : sockets[1].score,
                    }
                });
            }
        })
    })

    socket.on("playAgain",function(roomId){
        var oldRoomEmiter = io.sockets.in(socket.currentRoomId);
        var room = createRoom({user:socket.user,roomId,io,socket});
        socket.role = "";
        socket.again = 1;
        if(!roomId){
            oldRoomEmiter.emit("restart",room.id);
        }
    })

    socket.on('disconnect', (reason) => {
        console.log(new Date())
        console.log(socket.id)
        console.log("重连");
        console.log(reason)
        socket.leave(socket.currentRoomId)
        socket.currentRoomId = null;
    });
});

