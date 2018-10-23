let {getSocketsInRoom} = require("./utile");

var roles = [{
    roleId : "yunying",
    roleName : "运营"
},{
    roleId : "chanpin",
    roleName : "产品"
},{
    roleId : "meishu",
    roleName : "美术"
},{
    roleId : "qianduan",
    roleName : "前端"
},{
    roleId : "houduan",
    roleName : "后端"
},{
    roleId : "ceshi",
    roleName : "测试"
}]
var indexMap = {
    "yunying" : 0,
    "chanpin" : 1,
    "meishu" : 2,
    "qianduan" : 3,
    "houduan" : 4,
    "ceshi" : 5
}

module.exports = {
   
    map(id){
        var index = indexMap[id]
        if(index>=0&& index<6 && !isNaN(index)){
            return roles[index];
        }else{
            return this.mapByName(id);
        }
    },
    mapByName(name){
        for(var i=0;i<roles.length;i++){
            if(roles[i].roleName == name){
                return roles[i];
            }
        }
        return "";
    },
    getAllRoleInRoom(roomEventEmiter,mySocket){
      var roles = {};
      var otherRole = "";
      for(var id in roomEventEmiter.sockets){
          var socket = roomEventEmiter.sockets[id];
          if(socket.currentRoomId == mySocket.currentRoomId){
                roles[socket.id] =   socket.role;
                if(id != mySocket.id){
                    otherRole = socket.role || "";
                }
          }
         
      }
      return {
        roomRoles : roles,
        otherRole
      }
    },

    assignRandomRoleExlude(roleId){
        var randomRole = "";
        while(!randomRole || randomRole.roleId ==roleId){
            randomRole = this.doAssignRandomRole();
        }
        return randomRole;
    },
    
    doAssignRandomRole(){
        var random = parseInt(Math.random() * 10) % roles.length;
        return roles[random];;
    },

    assignRandomRole(roomEventEmiter,roomId){
       var {sockets} = getSocketsInRoom(roomEventEmiter,roomId);
       var roles = [sockets[0].role||"",sockets[1].role||""];
       if(roles[0] && !roles[1]){
          roles[1] = this.assignRandomRoleExlude(roles[0].id );
          sockets[1].role = roles[1];
          return roles;
       }
       if(!roles[0] && roles[1]){
            roles[0] = this.assignRandomRoleExlude(roles[1].id );
            sockets[0].role = roles[0];
            return roles;
        }
        if(!roles[0] && !roles[1]){
            roles[0] = this.doAssignRandomRole();
            roles[1] = this.assignRandomRoleExlude(roles[0].roleId );
            sockets[0].role = roles[0];
            sockets[1].role = roles[1];
            return roles;
        }
        return roles;
    }
}