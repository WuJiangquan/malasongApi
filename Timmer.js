/*
    @parameter totalTime  单位s  默认60s
     @parameter frameps  默认25帧
*/
module.exports = class Timmer{
    constructor({
        frameps,
        totalTime
    }){
        this.frameps = frameps || 25;
        this.totalTime = totalTime || 60;
        this.intervalTime = 1000  /  this.frameps;
        this.totleCountNum =  this.totalTime * this.frameps
        this.timmer = null;
        this.lessTime = this.totalTime;
        this.lessCount = this.totleCountNum ;
    }

    start(countCallback,stopCallback){
        var count = 0;
        this.timmer = setInterval(()=>{
            if(count >=  this.totleCountNum ){
                this.stop(stopCallback);
            }{
                if("function" == typeof countCallback){
                    countCallback();
                }
                this.lessCount  = this.totleCountNum - count
                this.lessTime  = parseInt((this.lessCount ) / this.frameps);
                if(this.lessCount % this.frameps>0){
                    this.lessTime += 1;
                }
                ++count;
                
            }
            
        }, this.intervalTime )
    }

    stop(stopCallback){
        if("function" == typeof stopCallback){
            stopCallback();
        }
        clearInterval(this.timmer);
    }
}