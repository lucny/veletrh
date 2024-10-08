
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const runButton = document.getElementById('run');
const editor = document.getElementById('editor');
const steps = document.getElementById('steps');
const commands = document.getElementById('commands');
const chars = document.getElementById('chars');
const victims = document.getElementById('victims');
const info = document.getElementById('info');
const numFlies = 5;

let pointer = 0;
let spiderOld = {};
let flies = [];
let fliesOld = [];
let numKilled = 0;


const codeEditor = CodeMirror.fromTextArea(editor, {
    lineNumbers: true,
    lines: true
});

class Fly {
    constructor(x, y, size = 30) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.image = new Image();
        this.image.src = 'img/fly.png';
        this.killed = false;
    }

    paint(ctx) {
        ctx.fillStyle = 'rgba(255,255,0,0.0)';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        this.image.onload = () => {
            ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
        };        
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
}

function generateFlies(numFlies) {
    for (let i = 0; i < numFlies; i++) {
        flies.push(new Fly(Math.floor(Math.random() * (canvas.width - 60)) + 30, Math.floor(Math.random() * (canvas.height - 60)) + 30, Math.floor(Math.random()*10 + 20)));
    }
}

let finish = {
    x: canvas.width-48,
    y: canvas.height-48,
    size: 48,
    detected: false,
    image: new Image(),

    paint(ctx) {
        ctx.fillStyle = 'rgba(255,255,0,1)';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        this.image.src = 'img/finish.png';
        this.image.onload = () => {
            ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
        };        
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
}

let spider = {
    /* Atributy objektu */
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    speed: 50,
    directions: ['up','right','down','left'],
    direction: 1,
    stop: false,
    fillStyle: 'rgba(255,0,0,0.0)',
    image: new Image(),
    instructions: [],
    /* Metody objektu */
    paint: function (ctx) {
        ctx.fillStyle = this.fillStyle;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.image.src = 'img/spider-'+ this.directions[this.direction] +'.png';
        this.image.onload = () => {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        };
    },

    animate: function(instr) {
        if (this.instructions[instr] == 'rotate') {            
            this.direction = this.direction < this.directions.length - 1 ? this.direction + 1 : 0;
        }
        if (this.instructions[instr] == 'go') {
            switch (this.directions[this.direction]) {
                case 'up':
                    this.y -= this.speed;
                    if (this.y <= 0) info.innerText = 'Spider is out!';
                    break;
                case 'right' :
                    this.x += this.speed;
                    if (this.x + this.width > canvas.width)  info.innerText = 'Spider is out!';
                    break;
                case 'down' :
                    this.y += this.speed;
                    if (this.y + this.height > canvas.height) info.innerText = 'Spider is out!';
                    break;
                case 'left' :
                    this.x -= this.speed;
                    if (this.x <= 0)  info.innerText = 'Spider is out!';
                    break;
            }
        }   
    },

    translate: function(code) {
        this.instructions = [];        
        let lines = code.split('\n');
        lines.forEach((val) => {
            if ((val == 'go') || (val == 'rotate')) this.instructions.push(val);
            else {
                let params = val.split(' ');
                if (params[0] == 'repeat') {
                    for (let i=0; i<params[1]; i++) {
                        this.instructions.push(params[2]);
                    }
                }
            }
        })
        console.log(this.instructions);
    },

    detect: function (mX, mY) {
        if (mX >= this.x && mX <= this.x + this.width && mY >= this.y && mY <= (this.y + this.height)) {
            return true;
        } else {
            return false;
        }
    },
}

spiderOld = JSON.parse(JSON.stringify(spider));
generateFlies(numFlies);

function clearCanvas(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let background = new Image();
    background.src = 'img/web.png';
    background.onload = () => {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    };
    canvas.style.border = '2px solid black';    
}

function paint() {
    clearCanvas('white');
    flies.forEach(function(sf){
        if (!sf.killed) sf.paint(ctx);
    })    
    finish.paint(ctx);
    spider.paint(ctx);
}

runButton.addEventListener('click', ()=> {
    runButton.disabled = true;
    numKilled = 0;
    flies.forEach(function(sf, idx){
            flies[idx].killed = false;
    });
    finish.detected = false;
    spider.translate(codeEditor.getValue());
    /*codeEditor.eachLine((line) => {
        console.log(line);
    });
    codeEditor.setSelection({line: 1, ch:0}, {line: 1});*/
    spider.x = spiderOld.x;
    spider.y = spiderOld.y;
    spider.direction = spiderOld.direction;

    let timer = window.setInterval(function(){
        steps.innerText = pointer;
        commands.innerText = codeEditor.lineCount(); 
        chars.innerText = codeEditor.getValue().length;  
        if (pointer == spider.instructions.length) {
            pointer = 0;
            runButton.disabled = false;
            window.clearInterval(timer);
            return;
        }
        spider.animate(pointer);
        numKilled = 0;
        flies.forEach(function(sf){
            if (spider.detect(sf.x,sf.y)) {
                sf.killed = true;                
                info.innerText = 'Bingo! Fly is dead.';
            } 
            if (sf.killed) numKilled++;
        })
        if (spider.detect(finish.x,finish.y)) {
            finish.detected = true;            
            if (numKilled == numFlies) {
                info.innerText = 'GAME IS OVER! Congrats!'
            }
        }         
        victims.innerText = numKilled;
        pointer++;
        paint();
    }, 200)
})

paint();
