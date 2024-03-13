(() => {
    
    let render;
    const gameWidth=500;
    const gameHeight=500;
    const ballRadius = 10;
    const meleeRadius = 15;
    const secretGetRadius = 10;
    const secretHintRadius = 30;
    let secretHintCounter = -1;

    let isFlinging = false;
    let mouseX = 0;
    let mouseY = 0;
    let mouseDownX = 0;
    let mouseDownY = 0;
    let flingAngle = null;
    let flingDistance = null;
    let hero;
    let enemyContext;
    let lightContext;
    let effectsContext;
    let enemies = [];
    let spotlights = [];
    let sightWalls = [];
    let secret = {};
    let gameInterval;
    const gameIntervalDuration=10;
    let gameIntervalCounter = 0;
    const showSecret = false;

    const keyframeDuration = 50;
    let totalKeyframes = 20; // potential keyframes for phrases. 10 seconds, .5 second each
    let currentKeyframe = 0;


	function init() {
        initEngine();
        initLevel1();
        initMouseHandlers();
        initCanvases();
        initLoop();
        updateGoals();

        //$("#reset").click(init);
	}

    function initEngine() {
		engine = Matter.Engine.create();
        physicsCanvas = document.getElementById('physics');
		engine.world.gravity.y = 0;
		render = Matter.Render.create({
			canvas: physicsCanvas,
			engine: engine,
			options: {
				width: gameWidth,
				height: gameHeight,
				wireframes: false, // need this or various render styles won't take
				background: 'transparent',
                wireframeBackground: 'transparent'
			}
		});
		Matter.Render.run(render);
		runner = Matter.Runner.create();
		Matter.Runner.run(runner, engine);

    }

    function initLevel1(){

        addHero(100, 100);
        
        secret = {x:150, y:295};

        //set up sight boundaries with outer walls
        sightWalls = [];
        sightWalls.push({a:{x:0,y:0}, b:{x:gameWidth,y:0}});
        sightWalls.push({a:{x:gameWidth,y:0}, b:{x:gameWidth,y:gameHeight}});
        sightWalls.push({a:{x:gameWidth,y:gameHeight}, b:{x:0,y:gameHeight}});
        sightWalls.push({a:{x:0,y:gameHeight}, b:{x:0,y:0}});
        
		Matter.World.add(engine.world, [
			addWall(-30,0,40,gameHeight,0,false),
			addWall(0,-30,gameWidth,40,0,false),
			addWall(0,gameHeight-10,gameWidth,40,0,false),
			addWall(gameWidth-10,0,40,gameHeight,0,false),
            //addRoundWall(gameWidth, gameWidth/2, 70),
            
			addWall(170,290,gameWidth*.25,10,0,true),
			addWall(0,290,gameWidth*.25,10,0,true),
            
			addWall(200,0,10,gameHeight/4,0,true)
        ]);
    
        enemies = [];
        addEnemy(400, 400, 0, 0, true);


        
        const e1 = addEnemy(300, 400, 0, .5, false);
        addAnimationPhase(e1.anim, 300, 400, Math.PI, 0, 1);
        addAnimationPhase(e1.anim, 250, 400, Math.PI, 1, 8);
        addAnimationPhase(e1.anim, 250, 400, 0, 10, 11);
        addAnimationPhase(e1.anim, 300, 400, 0, 11, 18);

        
        const e2 = addEnemy(400, 50, Math.PI/2, .5, false);
        addAnimationPhase(e2.anim, 400, 50, Math.PI/2, 0, 1);
        addAnimationPhase(e2.anim, 400, 300, Math.PI/2, 1, 8);
        addAnimationPhase(e2.anim, 400, 300, -Math.PI/2, 10, 11);
        addAnimationPhase(e2.anim, 400, 100, -Math.PI/2, 11, 18);

        spotlights = [];
        const s1 = addSpotlight(270,200,0,30);
        addAnimationPhase(s1.anim, 300, 150, 0, 0, 10)
        addAnimationPhase(s1.anim, 270, 200, 0, 10, 0)
    }
    
    function initLevel(){

        secret = {x:50, y:50};
        //set up sight boundaries with outer walls
        sightWalls = [];
        sightWalls.push({a:{x:0,y:0}, b:{x:gameWidth,y:0}});
        sightWalls.push({a:{x:gameWidth,y:0}, b:{x:gameWidth,y:gameHeight}});
        sightWalls.push({a:{x:gameWidth,y:gameHeight}, b:{x:0,y:gameHeight}});
        sightWalls.push({a:{x:0,y:gameHeight}, b:{x:0,y:0}});
        
		Matter.World.add(engine.world, [
			addWall(-30,0,40,gameHeight,0,false),
			addWall(0,-30,gameWidth,40,0,false),
			addWall(0,gameHeight-10,gameWidth,40,0,false),
			addWall(gameWidth-10,0,40,gameHeight,0,false),
            //addRoundWall(gameWidth, gameWidth/2, 70),
            
			addWall(140,290,gameWidth*.25,10,0,true),
			addWall(0,290,gameWidth*.25,10,0,true),
			addWall(200,0,10,gameHeight/4,0,true)
        ]);
    
        addHero(100, 100);
        enemies = [];
        addEnemy(100, 400, 0, 0, true);

        addEnemy(400, 50, 0, false, true);
        const e1 = addEnemy(300, 400, 0, .5, false);
        addAnimationPhase(e1.anim, 300, 400, Math.PI, 0, 1);
        addAnimationPhase(e1.anim, 250, 400, Math.PI, 1, 8);
        addAnimationPhase(e1.anim, 250, 400, 0, 10, 11);
        addAnimationPhase(e1.anim, 300, 400, 0, 11, 18);

        spotlights = [];
        const s1 = addSpotlight(270,200,0,30);
        addAnimationPhase(s1.anim, 300, 150, 0, 0, 10)
        addAnimationPhase(s1.anim, 270, 200, 0, 10, 0)
    }

    function checkAnimationPhase(l){
        const newPhase = l?.anim?.phases?.find( p => p.start==currentKeyframe);
        if (newPhase){
            const iterations = (newPhase.end-newPhase.start)*keyframeDuration;
            l.anim.xv= (newPhase.x - l.x)/iterations;
            l.anim.yv= (newPhase.y - l.y)/iterations;
            l.anim.av= (newPhase.a - l.a)/iterations;
        }
        else {
            const oldPhase = l.anim.phases.find( p => p.end===currentKeyframe);
            if (oldPhase){
                l.anim.xv=0;
                l.anim.yv=0;
                l.anim.av=0;
            }
        }
    }

    function initLoop(){
        clearInterval(gameInterval)
        gameInterval = setInterval( ()=>{
            gameIntervalCounter++;
            if (gameIntervalCounter % keyframeDuration == 0) {
                spotlights.forEach( l => checkAnimationPhase(l));
                enemies.forEach( e => checkAnimationPhase(e));
                currentKeyframe = (currentKeyframe+1) % totalKeyframes;
            }
            
            if (gameIntervalCounter % (1000/gameIntervalDuration) == 0) { //every second
                addTime();
            }
            updateSight();
            updateEnemies();
            updateLights();
            updateEffects();
        },gameIntervalDuration)
    }

    function initCanvases(){
        enemyContext = document.getElementById("enemies").getContext('2d');
        enemyContext.clearRect(0, 0, gameWidth, gameHeight);
        lightContext = document.getElementById("light").getContext('2d');
        lightContext.clearRect(0, 0, gameWidth, gameHeight);
        sightContext = document.getElementById("sight").getContext('2d');
        sightContext.clearRect(0, 0, gameWidth, gameHeight);
        effectsContext = document.getElementById("effects").getContext('2d');
        effectsContext.clearRect(0, 0, gameWidth, gameHeight);
    }


    function updateEnemies(){

        const hx = hero.position.x;
        const hy = hero.position.y;

        enemyContext.clearRect(0, 0, gameWidth, gameHeight);
        enemies.forEach( e => {

            if (e.anim?.phases?.length>0){
                e.x+=e.anim.xv;
                e.y+=e.anim.yv;
                e.a+=e.anim.av;
            }

            if (e.isTarget){
                enemyContext.fillStyle = '#000000';
                enemyContext.beginPath();
                enemyContext.arc(e.x, e.y, ballRadius, 0, 2*Math.PI);
                enemyContext.fill();
                
                enemyContext.fillStyle = '#FFFFFF';
                enemyContext.beginPath();
                enemyContext.arc(e.x, e.y, ballRadius*2/3, 0, 2*Math.PI);
                enemyContext.fill();
                
                enemyContext.fillStyle = '#000000';
                enemyContext.beginPath();
                enemyContext.arc(e.x, e.y, ballRadius*1/3, 0, 2*Math.PI);
                enemyContext.fill();
            }
            else {
                enemyContext.fillStyle = '#000000';
                enemyContext.beginPath();
                enemyContext.arc(e.x, e.y, ballRadius, 0, 2*Math.PI);
                enemyContext.fill();
            }

            const d = getDistance(hx, hy, e.x, e.y);
            if( d<meleeRadius ) killEnemy(e);
            
        })
    }

    function updateLights(){
        const hx = hero.position.x;
        const hy = hero.position.y;

        lightContext.clearRect(0, 0, gameWidth, gameHeight);
        spotlights.forEach( l => {
            
            if (l.anim?.phases?.length>0){
                l.x+=l.anim.xv;
                l.y+=l.anim.yv;
                l.a+=l.anim.av;
            }

            lightContext.fillStyle = '#FFFFFF';
            lightContext.beginPath();
            lightContext.arc(l.x, l.y, l.r, 0, 2*Math.PI);
            lightContext.fill();
        });

        enemies.forEach( e => {
            if (e.sightRadius){
                let minA = e.a-e.sightRadius;
                let maxA = e.a+e.sightRadius;
                drawSight(e.x, e.y, minA, maxA, 9999, lightContext, sightWalls);
            }
        });

        const d = lightContext.getImageData(hx, hy,1,1);
        if (d.data[3]>0) {
            loseGame();
        }

    }
    function updateSight(){
        sightContext.clearRect(0, 0, gameWidth, gameHeight);
        const hx = hero.position.x;
        const hy = hero.position.y;
        
        drawSight(hx, hy, null, null, 9999, sightContext, sightWalls);
    }

    function updateEffects(){

        effectsContext.clearRect(0, 0, gameWidth, gameHeight);
        const hx = hero.position.x;
        const hy = hero.position.y;
        if (flingDistance!==null){
            const cursor = getNewPoint(hx, hy, flingAngle, flingDistance);
            const tangent1 = getNewPoint(hx, hy, flingAngle+Math.PI/2, ballRadius);
            const tangent2 = getNewPoint(hx, hy, flingAngle-Math.PI/2, ballRadius);
            effectsContext.fillStyle = '#FFFFFF11';
            effectsContext.beginPath();
            effectsContext.moveTo(tangent1.x, tangent1.y);
            effectsContext.lineTo(tangent2.x, tangent2.y);
            effectsContext.lineTo(cursor.x, cursor.y);
            effectsContext.lineTo(tangent1.x, tangent1.y);
            effectsContext.fill();
        }

        if (showSecret){
            effectsContext.fillStyle = '#ff000099';
            effectsContext.beginPath();
            effectsContext.arc(secret.x, secret.y, 3, 0, 2*Math.PI);
            effectsContext.fill();
        }
        if (!goals.secret){
            const secretDistance = getDistance(hero.position.x, hero.position.y, secret.x, secret.y);

            if (secretDistance<secretGetRadius){
                goals.secret = true;
            }

            if (secretHintCounter>=49){
                secretHintCounter=-1
            }
            if (secretDistance<secretHintRadius && secretHintCounter==-1){
                secretHintCounter=0;
            }
            if (secretHintCounter>-1){
                secretHintCounter++;
                if (secretHintCounter<25) {
                    r = secretHintCounter/6;
                    effectsContext.strokeStyle = '#FFFFFF';
                    effectsContext.beginPath();
                    effectsContext.moveTo(secret.x-r, secret.y);
                    effectsContext.lineTo(secret.x+r, secret.y);
                    effectsContext.moveTo(secret.x, secret.y-r);
                    effectsContext.lineTo(secret.x, secret.y+r);
                    effectsContext.stroke();
                }
                else if (secretHintCounter<50) {
                    r = (50-secretHintCounter)/12;
                    effectsContext.strokeStyle = '#FFFFFF';
                    effectsContext.beginPath();
                    effectsContext.moveTo(secret.x-r, secret.y-r);
                    effectsContext.lineTo(secret.x+r, secret.y+r);
                    effectsContext.moveTo(secret.x+r, secret.y-r);
                    effectsContext.lineTo(secret.x-r, secret.y+r);
                    effectsContext.stroke();
                }
                
            }
        }

    }

    function loseGame (){
        console.log("you died");
        clearInterval(gameInterval);
		Matter.Render.stop(render);
    };

    function winGame (){
        console.log("you win");
        setCompleted();
        clearInterval(gameInterval);
		Matter.Render.stop(render);
    };
    


// // ================ UI HANDLERS ====================

    function initMouseHandlers() {

        document.addEventListener('mousedown', function(e){
            e.preventDefault();
            mouseDownX = e.pageX;
            mouseDownY = e.pageY;
            isFlinging = true;
        })

        document.addEventListener('mousemove', function(e){
            e.preventDefault();
            mouseX = e.pageX;
            mouseY = e.pageY;
            if (isFlinging) {
                flingAngle = getAngle(mouseDownX, mouseDownY, mouseX, mouseY);
                flingDistance = getDistance(mouseDownX, mouseDownY, mouseX, mouseY);
                flingDistance = Math.min(flingDistance, 120);
            }
            else {
                flingAngle = null;
                flingDistance = null;
            }
        })

        document.addEventListener('mouseup', function(e){
            e.preventDefault();
            
            if (isFlinging) {
                addStroke();
                applyForce(hero, flingDistance, flingAngle+Math.PI);
                isFlinging = false;
            }
            flingDistance = null;
            flingDistance = null;
        })
    }

// // ================ GAMEPLAY ====================

    function addAnimationPhase(anim, x, y, a, start, end){
        anim.phases.push({x,y,a,start,end});
    }

    function newAnim(){
        return {
            phases: [],
            currentPhase:0,
            xv:0,
            yv:0,
            av:0
        }
    }

    function addSpotlight(x, y, a, r) { //x, y, angle, radius
        const anim = newAnim();
        const s = {x, y, a, r, anim};
        spotlights.push( s );
        return s;
    }

    function addEnemy(x, y, a, sightRadius, isTarget) { //x, y, angle, is the goal for this level
        const anim = newAnim();
        const e = {x, y, a, sightRadius, isTarget, anim}
        enemies.push(e);
        return e;
    }

    function killEnemy(e) {
        addKill();
        if (e.isTarget) {
            winGame();
        }
        enemies.splice(enemies.indexOf(e), 1);
    }

// // ================ MANAGING PHYSICS ====================

	function addWall(x, y, w, h, rotation, blockSight) {
		const newWall = Matter.Bodies.rectangle(x+w/2, y+h/2, w, h,  {
			isStatic: true,
			render: { visible: false },
			render: { fillStyle: "#000000" }
		});
        //if (rotation) Matter.Body.rotate(newWall, degreesToRadians(rotation));

        if (blockSight){
            sightWalls.push( {a:{x,y}, b:{x:x+w,y}} );
            sightWalls.push( {a:{x:x+w,y}, b:{x:x+w,y:y+h}} );
            sightWalls.push( {a:{x:x+w,y:y+h}, b:{x,y:y+h}} );
            sightWalls.push( {a:{x,y:y+h}, b:{x,y}} );
        }

        return newWall
	}

	function addRoundWall(x, y, r) {
		return Matter.Bodies.circle(x, y, r, {
			isStatic: true,
			render: { fillStyle: "#000000" }
		});
	}

    function addHero(x, y){
        let body = Matter.Bodies.circle(x, y, ballRadius, {
			isStatic: false,
			restitution: 1,
            friction: 0,
            render: {
                fillStyle: "#000000"
            },
		});
		Matter.World.add(engine.world, body);
        hero = body;
        heroFollow = {x,y};
    }

    function applyForce(body, d, angle){
        
        const v = Math.sqrt(d)/1400;
        let fx = v * Math.cos(angle);
        let fy = v * Math.sin(angle);
        Matter.Body.applyForce( body, body.position, {x:fx, y: fy});
    }


// // ================ Goals Functions ====================

    let goals = {
        completed: false,
        strokes: 0,
        time: 0,
        kills: 0,
        secret: false
    }
    let goalTargets = {
        completed: true,
        strokes: 2,
        time: 8,
        kills: 2,
        secret: true
    }
    
    function setCompleted(){
        goals.completed = true;
        updateGoals();
    }
    
    function addStroke(){
        goals.strokes++;
        updateGoals();
    }
    
    function addTime(){
        goals.time++;
        updateGoals();
    }
    
    function addKill(){
        goals.kills++;
        updateGoals();
    }
    function setSecret(){
        goals.secret = true;
        updateGoals();
    }
    function updateGoals(){
        $("#completed h2").text(goals.completed?"Yes":"No");
        $("#strokes h2").text(goals.strokes+"/"+goalTargets.strokes);
        $("#speed h2").text(goals.time+"/"+goalTargets.time);
        $("#kills h2").text(goals.kills+"/"+goalTargets.kills);
        $("#secret h2").text(goals.secret?"Yes":"No");
    }


// // ================ UTILITY FUNCTIONS ====================


    function getAngle(x1, y1, x2, y2){
        return Math.atan2(y2 - y1, x2 - x1);
    }
    function getDistance(x1, y1, x2, y2){
        return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) );
    }
    function getNewPoint(x1, y1, a, d){
        const x = x1 + Math.cos(a)*d;
        const y = y1 + Math.sin(a)*d;
        return {x, y}
    }


    

// ================ CALL INIT ====================
$( document ).ready(function() {
    init();
});




//     function getAngle(x1, y1, x2, y2){
//         return angleRadians = Math.atan2(y2 - y1, x2 - x1);
//     }

//     function polarToCartesian(centerX, centerY, radius, angleInRadians) {
//         return {
//           x: centerX + (radius * Math.cos(angleInRadians)),
//           y: centerY + (radius * Math.sin(angleInRadians))
//         };
//     }

//     function degreesToRadians(degrees){
//         return (degrees-90) * Math.PI / 180.0;
//     }


//     function getTouchDistance(){
//         const ballPos = ball.body.position;
//         return getDistance(touchX, touchY, ballPos.x, ballPos.y); 
//     }

//     function getDistance(x1, y1, x2, y2){
//         let dx = x2-x1;
//         let dy = y2-y1;
//         return Math.sqrt(dx*dx + dy*dy );
//     }




        // Matter.Events.on(engine, "collisionStart", function(e) {
        //     e.pairs.forEach( pair => {
        //         if (pair.bodyA.ball) pair.bodyA.ball.modifiers.forEach( m => {
        //             if (m.type.onCollision) {
        //                 setTimeout( function() {
        //                     m.type.onCollision(pair.bodyA.ball, pair.bodyB.ball);
        //                 }, BOARD.COLLISION_DELAY );
        //             }   
        //         });
        //         if (pair.bodyB.ball) pair.bodyB.ball.modifiers.forEach( m => {
        //             if (m.type.onCollision) {
        //                 setTimeout( function() {
        //                     m.type.onCollision(pair.bodyB.ball, pair.bodyA.ball);
        //                 }, BOARD.COLLISION_DELAY );
        //             }   
        //         });
        //     })
        // })

})();