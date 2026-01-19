class Scene
{
    constructor()
    {
        this.ctx=document.getElementById("myCanvas").getContext("2d");
        this.canvas=document.getElementById("myCanvas");
        this.entityManager=[];
        this.to_die=[];
        this.currentFrame=0;
    }
    init()
    {
        for(let i=0; i<20; i++){
            this.entityManager.push(new Entity("brown", [64*i, 64*9, 64, 64]));
        }
        this.entityManager.push(new Entity('brown', [64*10, 64*5, 64, 64], 'M'));
        this.entityManager.push(new Entity('brown', [64*13-10, 64*5, 64, 64], 'I'));
        let arr1=['r', 'o', 's.'];
        for(let i=0; i<arr1.length; i++){
            this.entityManager.push(new Entity('brown', [64*16+i*64-18, 64*5, 64, 64], arr1[i]))
        }
        this.player=new Entity("rgb(60, 188, 252)", [64*2, 64*4, 50, 55])
        this.player.sprite=document.getElementById('images');

        this.entityManager.push(this.player);
    }
    getBrown(){
        let t1=[];
        for(let e of this.entityManager){
            if(e.color=="brown"){
                t1.push(e);
            }
        }
        return t1;
    }
    update()
    {
        this.deathUpdate();
        this.userInput();
        this.sMovement();
        this.sCollision();
        //console.log(this.player.rect[1], this.player.velocity);
        this.sRender();
        this.sAnimation();
    }
    deathUpdate(){
        for(let i in this.entityManager){
            for(let j in this.to_die){
                if(this.entityManager[i]==this.to_die[j]){
                    this.entityManager.splice(i, 1);
                }
            }
        }
        this.to_die=[];
    }
    sRender()
    {
        this.ctx.fillStyle="rgb(100, 100, 255)";
        this.ctx.fillRect(0, 0, 1280, 640);
        this.ctx.fillStyle="rgb(255, 255, 255)";

        this.ctx.font = 34 + 'pt Arial';
        this.ctx.fillText("super", 64*11, 64*5);

        this.ctx.font = 64 + 'pt Arial';
        this.ctx.fillText("ARNOB", 64*11, 64*6);
        for(let i of this.entityManager){
            if(i.sprite==null){
                this.ctx.fillStyle=i.color;
                this.ctx.fillRect(i.rect[0], i.rect[1], i.rect[2], i.rect[3]);
                this.ctx.strokeRect(i.rect[0], i.rect[1], i.rect[2], i.rect[3]);
                if(i.texture != null){
                    this.ctx.fillStyle="rgb(0, 0, 0)";
                    this.ctx.font = 60 + 'pt Arial';
                    let tsize = this.ctx.measureText(i.texture).width / 2;
                    this.ctx.fillText(i.texture, i.rect[0] + 0.5*i.rect[2] -tsize, i.rect[1]+i.rect[3]);
                }
            }
            else{
                this.ctx.save(); // prevent scale stacking
                
                if (i.transform === -1) {
                    this.ctx.translate(i.rect[0] + i.rect[2], i.rect[1]);
                    this.ctx.scale(-1, 1);
                } else {
                    this.ctx.translate(i.rect[0], i.rect[1]);
                }
                console.log('drawing sprite');
                if((this.player.state=="standing" || this.player.state=="jumping")&& i==this.player){
                    this.ctx.drawImage(i.sprite, 0,0, 64, 64);
                }
                else if(this.player.state=="running" && i==this.player){
                    this.ctx.drawImage(i.sprite, 64*(Math.floor(this.currentFrame/10)%4), 0, 64, 64, 0, 0, 64, 64);   
                }
                this.ctx.restore();
            }
        }
    }
    sMovement()
    {
        //if(this.player.rect[1]>64*8){this.player.rect[1]=64*8;}
        if (this.player.up && this.player.state != "jumping")
        {
            this.player.velocity[1] = -20;
            this.player.state="jumping";
        }
        if(this.player.right){
            this.player.velocity[0]+=0.2;
            this.player.transform=1;
            console.log('p');
        }
        else if(this.player.left){
            this.player.velocity[0]-=0.2;
            this.player.transform=-1;
            console.log('p');
        }
        if(this.player.velocity[0]>5){
            this.player.velocity[0]=5;
        }
        else if(this.player.velocity[0]<-5){
            this.player.velocity[0]=-5;
        }
        if(!this.player.right && !this.player.left){
            this.player.velocity[0]=0;
        }
        
        this.player.prevRect=[...this.player.rect];
        this.player.velocity[1]+=0.75;

        for(let i of this.entityManager){
            if(i.velocity!=null){
                i.rect[0]+=i.velocity[0];
                i.rect[1]+=i.velocity[1];
            }
        }
        //this.player.rect[0]+=this.player.velocity[0];
        //this.player.rect[1]+=this.player.velocity[1];
        if(this.player.rect[0]<0){this.player.rect[0]=0;}
        else if(this.player.rect[0]>19*64){this.player.rect[0]=19*64;}
    }
    sCollision()
    {
        this.player.state="jumping";
        let physics1=new Physics();
        for(let t1 of this.getBrown()){
            if(physics1.getOverlap(t1, this.player)[0]>0 && physics1.getOverlap(t1, this.player)[1]>0){
                
                if(physics1.getPreviousOverlap(t1, this.player)[0]>0){
                    if(this.player.prevRect[1]< t1.rect[1]){
                        //console.log(physics1.getPreviousOverlap(t1, this.player));
                        this.player.rect[1]-= physics1.getOverlap(t1, this.player)[1];
                        //console.log(physics1.getPreviousOverlap(t1, this.player));
                        if(this.player.velocity[0]==0){
                            this.player.state='standing';
                        }
                        else if(this.player.velocity[0]!=0){
                            this.player.state='running';
                        }
                    }
                    else if(this.player.prevRect[1] > t1.rect[1]){
                        this.player.rect[1]+= physics1.getOverlap(t1, this.player)[1];
                        this.to_die.push(t1);
                    }
                    this.player.velocity[1]=0;

                }
                else if(physics1.getPreviousOverlap(t1, this.player)[1]>0){
                    if(this.player.prevRect[0] < t1.rect[0]){
                        console.log('shifting left');
                        this.player.rect[0]-= physics1.getOverlap(t1, this.player)[0];
                    }
                    else if(this.player.prevRect[0] > t1.rect[0]){
                        console.log('shifting right');
                        this.player.rect[0]+= physics1.getOverlap(t1, this.player)[0];
                    }
                    this.player.velocity[0]*=-1;
                    
                }
                
            }
        }
    }
    sAnimation()
    {
        if(this.player.state=="standing"){
            let img =document.getElementById('stand');
            img.src="./col/megaman/stand64.png";
            this.currentFrame=0;
        }
        else if(this.player.state=="jumping"){
            let img =document.getElementById('stand');
            img.src="./col/megaman/air64.png";
            this.currentFrame=0;
        }
        else if(this.player.state=="running"){
            let img =document.getElementById('stand');
            img.src="./col/megaman/run64.png";
            this.currentFrame+=1;
        }
        this.player.sprite=document.getElementById('stand');
        
    }
    userInput()
    {
        window.addEventListener("keydown", (e)=>{
            if(e.code=="KeyW"){this.player.up=true;}
            else if(e.code=="KeyD"){this.player.right=true;}
            else if(e.code=="KeyA"){this.player.left=true;}
        });
        window.addEventListener("keyup", (e)=>{if(e.code=="KeyW"){
                this.player.up=false; }    
        else if(e.code=="KeyD"){this.player.right=false;}
        else if(e.code=="KeyA"){this.player.left=false;}
        });
    }
}