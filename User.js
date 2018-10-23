const fs = require("fs");
module.exports =  class User{
    constructor(){
        
    }

    static getInfo(user){
       return new Promise((resolve,reject)=>{
            this.getUsers()
            .then((users)=>{
                if(null === users){
                    resolve(null);
                }
                for(let i=0,len = users.length;i<len;i++){
                    if(users[i].name === user.userName &&  users[i].password === user.password ){
                        resolve(users[i]);
                    }
                }
                resolve(null);
            })
       })
    }

    

   static getUsers(){
        return new Promise((resolve,reject)=>{
            fs.readFile('./users.json', 'utf8', (error,data)=>{
                var res = null
                if(error === null){
                    res = JSON.parse(data);
                }
                resolve(res);
            });
        })
    }
}