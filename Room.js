module.exports = class Room{
    constructor({index,user}){
        this.state = 0;
        this.id = "room" + index;
        this.userSockets = [];
        this.users = [];
        // this.level = this.userLevel2RoomLevel(user.level);
        this.socketIds = [];
    }

    userLevel2RoomLevel(level){
        return parseInt(level/3);
    }

    matchLevel(user){
        return  this.userLevel2RoomLevel(user.level) ===  this.level;
    }

    mathUserSuccess(){
        return this.socketIds.length >= 2;
    }

    joinedTheUser(socketId){
        for(var i =0;i<this.socketIds.length;i++){
            if(socketId === this.socketIds[i]){
                return true;
            }
        }
        return false;
    }
}