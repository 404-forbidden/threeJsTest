//변수 선언
var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var scoreDom;
var sun;
var ground;
//var orbitControl;
var rollingGroundSphere;
var heroSphere;
var rollingSpeed=0.008;
var heroRollingSpeed;
var worldRadius=26;
var heroRadius=0.2;
var sphericalHelper;
var pathAngleValues;
var heroBaseY=1.8;
var bounceValue=0.1;
var gravity=0.005;
var leftLane=-1;
var rightLane=1;
var middleLane=0;
var currentLane;
var clock;
var jumping;
var treeReleaseInterval=0.5;
var lastTreeReleaseTime=0;
var treesInPath;
var treesPool;
var particleGeometry;
var particleCount=20;
var explosionPower =1.06;
var particles;
//var stats;
var score;
var isCollide;
var restartDom;
var highScoreDom;
var highScore=0;
var swiper;

//게임 실행
init();

//함수 정의
function init() {
    //scene 설정
    createScene();

    //게임 루프 실행
    update();
}

function createScene(){
    isCollide=false;
    score=0;
    treesInPath=[];
    treesPool=[];
    clock=new THREE.Clock();
    clock.start();
    heroRollingSpeed = 0.208;
    //heroRollingSpeed=(rollingSpeed*worldRadius/heroRadius)/5;
    sphericalHelper = new THREE.Spherical();
    pathAngleValues=[1.52,1.57,1.62];
    sceneWidth = window.innerWidth - 1;
    sceneHeight = window.innerHeight - 2;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xf0fff0, 0.07 );
    camera = new THREE.PerspectiveCamera( 60, sceneWidth / sceneHeight, 0.1, 1000 );
    renderer = new THREE.WebGLRenderer({alpha:true});
    renderer.setClearColor(0xfffafa, 1); 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );
    renderer.domElement.id = "myCanvas";
    dom = document.getElementById('container');
    dom.appendChild(renderer.domElement);

    swiper = new Hammer(document.getElementById('myCanvas'));
    swiper.get('swipe').set({ velocity: 0.3 })
    swiper.on('tap', function (e) {//위쪽(점프)
        if(!jumping) {
            bounceValue=0.1;
            jumping=true;
            validMove=false;
        }
    })
    swiper.on('swipeleft', function (e) {//왼쪽
        if(currentLane==middleLane){
            currentLane=leftLane;
        }else if(currentLane==rightLane){
            currentLane=middleLane;
        }else{
            validMove=false;	
        }
    })
    swiper.on('swiperight', function (e) {//오른쪽
        if(currentLane==middleLane){
            currentLane=rightLane;
        }else if(currentLane==leftLane){
            currentLane=middleLane;
        }else{
            validMove=false;	
        }
    })

    if(restartDom !== undefined) restartDom.style.display = "none";
    //stats = new Stats();
    //dom.appendChild(stats.dom);
    createTreesPool();
    addWorld();
    addHero();
    addLight();
    addExplosion();
    
    camera.position.z = 6.5;
    camera.position.y = 2.5;
    /*orbitControl = new THREE.OrbitControls( camera, renderer.domElement );//helper to rotate around in scene
    orbitControl.addEventListener( 'change', render );
    orbitControl.noKeys = true;
    orbitControl.noPan = true;
    orbitControl.enableZoom = false;
    orbitControl.minPolarAngle = 1.1;
    orbitControl.maxPolarAngle = 1.1;
    orbitControl.minAzimuthAngle = -0.2;
    orbitControl.maxAzimuthAngle = 0.2;
    */
    window.addEventListener('resize', onWindowResize, false);

    document.onkeydown = handleKeyDown;
    
    //점수
    scoreDom = document.getElementById('score');
    scoreDom.innerHTML = "0";
    highScoreDom = document.getElementById('highScore');
    highScore>0 ? highScoreDom.innerHTML = "HI&nbsp;&nbsp;" + highScore.toString() : highScoreDom.innerHTML = "";
}
function addExplosion(){
    particleGeometry = new THREE.Geometry();
    for (var i = 0; i < particleCount; i ++ ) {
        var vertex = new THREE.Vector3();
        particleGeometry.vertices.push( vertex );
    }
    var pMaterial = new THREE.ParticleBasicMaterial({
    color: 0xfffafa,
    size: 0.2
    });
    particles = new THREE.Points( particleGeometry, pMaterial );
    scene.add( particles );
    particles.visible=false;
}
function createTreesPool(){
    var maxTreesInPool=10;
    var newTree;
    for(var i=0; i<maxTreesInPool;i++){
        newTree=createTree();
        treesPool.push(newTree);
    }
}
function handleKeyDown(keyEvent){
    if(jumping)return;
    var validMove=true;
    if ( keyEvent.keyCode === 37) {//왼쪽
        if(currentLane==middleLane){
            currentLane=leftLane;
        }else if(currentLane==rightLane){
            currentLane=middleLane;
        }else{
            validMove=false;	
        }
    } else if (keyEvent.keyCode === 39) {//오른쪽
        if(currentLane==middleLane){
            currentLane=rightLane;
        }else if(currentLane==leftLane){
            currentLane=middleLane;
        }else{
            validMove=false;	
        }
    }else{
        if (keyEvent.keyCode === 38 || keyEvent.keyCode === 32){//위쪽(점프)
            bounceValue=0.1;
            jumping=true;
        }
        validMove=false;
    }
    //heroSphere.position.x=currentLane;
    if(validMove){
        jumping=true;
        bounceValue=0.06;
    }

    if(isCollide &&(keyEvent.keyCode === 38 || keyEvent.keyCode === 32)){
        //재시작
        if(isCollide) dom.removeChild(renderer.domElement);init();
    }
}
function addHero(){
    var sphereGeometry = new THREE.DodecahedronGeometry( heroRadius, 1);
    var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xe5f2f2 ,shading:THREE.FlatShading} )
    jumping=false;
    heroSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    heroSphere.receiveShadow = true;
    heroSphere.castShadow=true;
    scene.add( heroSphere );
    heroSphere.position.y=heroBaseY;
    heroSphere.position.z=4.8;
    currentLane=middleLane;
    heroSphere.position.x=currentLane;
}
function addWorld(){
    var sides=40;
    var tiers=40;
    var sphereGeometry = new THREE.SphereGeometry( worldRadius, sides,tiers);
    var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xfffafa ,shading:THREE.FlatShading} )
    
    var vertexIndex;
    var vertexVector= new THREE.Vector3();
    var nextVertexVector= new THREE.Vector3();
    var firstVertexVector= new THREE.Vector3();
    var offset= new THREE.Vector3();
    var currentTier=1;
    var lerpValue=0.5;
    var heightValue;
    var maxHeight=0.07;
    for(var j=1;j<tiers-2;j++){
        currentTier=j;
        for(var i=0;i<sides;i++){
            vertexIndex=(currentTier*sides)+1;
            vertexVector=sphereGeometry.vertices[i+vertexIndex].clone();
            if(j%2!==0){
                if(i==0){
                    firstVertexVector=vertexVector.clone();
                }
                nextVertexVector=sphereGeometry.vertices[i+vertexIndex+1].clone();
                if(i==sides-1){
                    nextVertexVector=firstVertexVector;
                }
                lerpValue=(Math.random()*(0.75-0.25))+0.25;
                vertexVector.lerp(nextVertexVector,lerpValue);
            }
            heightValue=(Math.random()*maxHeight)-(maxHeight/2);
            offset=vertexVector.clone().normalize().multiplyScalar(heightValue);
            sphereGeometry.vertices[i+vertexIndex]=(vertexVector.add(offset));
        }
    }
    rollingGroundSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    rollingGroundSphere.receiveShadow = true;
    rollingGroundSphere.castShadow=false;
    rollingGroundSphere.rotation.z=-Math.PI/2;
    scene.add( rollingGroundSphere );
    rollingGroundSphere.position.y=-24;
    rollingGroundSphere.position.z=2;
    addWorldTrees();
}
function addLight(){
    var hemisphereLight = new THREE.HemisphereLight(0xfffafa,0x000000, .9)
    scene.add(hemisphereLight);
    sun = new THREE.DirectionalLight( 0xcdc1c5, 0.9);
    sun.position.set( 12,6,-7 );
    sun.castShadow = true;
    scene.add(sun);
    sun.shadow.mapSize.width = 256;
    sun.shadow.mapSize.height = 256;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50 ;
}
function addPathTree(){
    var options=[0,1,2];
    var lane= Math.floor(Math.random()*3);
    addTree(true,lane);
    options.splice(lane,1);
    if(Math.random()>0.5){
        lane= Math.floor(Math.random()*2);
        addTree(true,options[lane]);
    }
}
function addWorldTrees(){
    var numTrees=36;
    var gap=6.28/36;
    for(var i=0;i<numTrees;i++){
        addTree(false,i*gap, true);
        addTree(false,i*gap, false);
    }
}
function addTree(inPath, row, isLeft){
    var newTree;
    if(inPath){
        if(treesPool.length==0)return;
        newTree=treesPool.pop();
        newTree.visible=true;
        //console.log("add tree");
        treesInPath.push(newTree);
        sphericalHelper.set( worldRadius-0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x+4 );
    }else{
        newTree=createTree();
        var forestAreaAngle=0;//[1.52,1.57,1.62];
        if(isLeft){
            forestAreaAngle=1.68+Math.random()*0.1;
        }else{
            forestAreaAngle=1.46-Math.random()*0.1;
        }
        sphericalHelper.set( worldRadius-0.3, forestAreaAngle, row );
    }
    newTree.position.setFromSpherical( sphericalHelper );
    var rollingGroundVector=rollingGroundSphere.position.clone().normalize();
    var treeVector=newTree.position.clone().normalize();
    newTree.quaternion.setFromUnitVectors(treeVector,rollingGroundVector);
    newTree.rotation.x+=(Math.random()*(2*Math.PI/10))+-Math.PI/10;
    
    rollingGroundSphere.add(newTree);
}
function createTree(){
    var sides=8;
    var tiers=6;
    var scalarMultiplier=(Math.random()*(0.25-0.1))+0.05;
    var midPointVector= new THREE.Vector3();
    var vertexVector= new THREE.Vector3();
    var treeGeometry = new THREE.ConeGeometry( 0.5, 1, sides, tiers);
    var treeMaterial = new THREE.MeshStandardMaterial( { color: 0x33ff33,shading:THREE.FlatShading  } );
    var offset;
    midPointVector=treeGeometry.vertices[0].clone();
    var currentTier=0;
    var vertexIndex;
    blowUpTree(treeGeometry.vertices,sides,0,scalarMultiplier);
    tightenTree(treeGeometry.vertices,sides,1);
    blowUpTree(treeGeometry.vertices,sides,2,scalarMultiplier*1.1,true);
    tightenTree(treeGeometry.vertices,sides,3);
    blowUpTree(treeGeometry.vertices,sides,4,scalarMultiplier*1.2);
    tightenTree(treeGeometry.vertices,sides,5);
    var treeTop = new THREE.Mesh( treeGeometry, treeMaterial );
    treeTop.castShadow=true;
    treeTop.receiveShadow=false;
    treeTop.position.y=0.9;
    treeTop.rotation.y=(Math.random()*(Math.PI));
    var treeTrunkGeometry = new THREE.CylinderGeometry( 0.1, 0.1,0.5);
    var trunkMaterial = new THREE.MeshStandardMaterial( { color: 0x886633,shading:THREE.FlatShading  } );
    var treeTrunk = new THREE.Mesh( treeTrunkGeometry, trunkMaterial );
    treeTrunk.position.y=0.25;
    var tree =new THREE.Object3D();
    tree.add(treeTrunk);
    tree.add(treeTop);
    return tree;
}
function blowUpTree(vertices,sides,currentTier,scalarMultiplier,odd){
    var vertexIndex;
    var vertexVector= new THREE.Vector3();
    var midPointVector=vertices[0].clone();
    var offset;
    for(var i=0;i<sides;i++){
        vertexIndex=(currentTier*sides)+1;
        vertexVector=vertices[i+vertexIndex].clone();
        midPointVector.y=vertexVector.y;
        offset=vertexVector.sub(midPointVector);
        if(odd){
            if(i%2===0){
                offset.normalize().multiplyScalar(scalarMultiplier/6);
                vertices[i+vertexIndex].add(offset);
            }else{
                offset.normalize().multiplyScalar(scalarMultiplier);
                vertices[i+vertexIndex].add(offset);
                vertices[i+vertexIndex].y=vertices[i+vertexIndex+sides].y+0.05;
            }
        }else{
            if(i%2!==0){
                offset.normalize().multiplyScalar(scalarMultiplier/6);
                vertices[i+vertexIndex].add(offset);
            }else{
                offset.normalize().multiplyScalar(scalarMultiplier);
                vertices[i+vertexIndex].add(offset);
                vertices[i+vertexIndex].y=vertices[i+vertexIndex+sides].y+0.05;
            }
        }
    }
}
function tightenTree(vertices,sides,currentTier){
    var vertexIndex;
    var vertexVector= new THREE.Vector3();
    var midPointVector=vertices[0].clone();
    var offset;
    for(var i=0;i<sides;i++){
        vertexIndex=(currentTier*sides)+1;
        vertexVector=vertices[i+vertexIndex].clone();
        midPointVector.y=vertexVector.y;
        offset=vertexVector.sub(midPointVector);
        offset.normalize().multiplyScalar(0.06);
        vertices[i+vertexIndex].sub(offset);
    }
}

function update(){
    //stats.update();
    //animate
    rollingGroundSphere.rotation.x += rollingSpeed;
    heroSphere.rotation.x -= heroRollingSpeed;
    if(heroSphere.position.y<=heroBaseY){
        jumping=false;
        bounceValue=(Math.random()*0.04)+0.005;
    }
    heroSphere.position.y+=bounceValue;
    heroSphere.position.x=THREE.Math.lerp(heroSphere.position.x,currentLane, 2*clock.getDelta());//clock.getElapsedTime());
    bounceValue-=gravity;
    if(clock.getElapsedTime()>treeReleaseInterval){
        clock.start();
        addPathTree();
        if(!isCollide){
            score+=2*treeReleaseInterval;
            scoreDom.innerHTML=score.toString();
            score>highScore ? highScore=score : highScore=highScore;
            highScoreDom.innerHTML="HI&nbsp;&nbsp;" + highScore.toString();
        }
    }
    doTreeLogic();
    doExplosionLogic();
    render();
    requestAnimationFrame(update);
}
function doTreeLogic(){
    var oneTree;
    var treePos = new THREE.Vector3();
    var treesToRemove=[];
    treesInPath.forEach( function ( element, index ) {
        oneTree=treesInPath[ index ];
        treePos.setFromMatrixPosition( oneTree.matrixWorld );
        if(treePos.z>6 &&oneTree.visible){
            treesToRemove.push(oneTree);
        }else{//충돌 체크
            if(treePos.distanceTo(heroSphere.position)<=0.6){
                console.log("hit");
                isCollide=true;
                gameover();
            }
        }
    });
    var fromWhere;
    treesToRemove.forEach( function ( element, index ) {
        oneTree=treesToRemove[ index ];
        fromWhere=treesInPath.indexOf(oneTree);
        treesInPath.splice(fromWhere,1);
        treesPool.push(oneTree);
        oneTree.visible=false;
        console.log("remove tree");
    });
}
function doExplosionLogic(){
    if(!particles.visible)return;
    for (var i = 0; i < particleCount; i ++ ) {
        particleGeometry.vertices[i].multiplyScalar(explosionPower);
    }
    if(explosionPower>1.005){
        explosionPower-=0.001;
    }else{
        particles.visible=false;
    }
    particleGeometry.verticesNeedUpdate = true;
}
function explode(){
    //폭발 효과
    particles.position.y=2;
    particles.position.z=4.8;
    particles.position.x=heroSphere.position.x;
    for (var i = 0; i < particleCount; i ++ ) {
        var vertex = new THREE.Vector3();
        vertex.x = -0.2+Math.random() * 0.4;
        vertex.y = -0.2+Math.random() * 0.4 ;
        vertex.z = -0.2+Math.random() * 0.4;
        particleGeometry.vertices[i]=vertex;
    }
    explosionPower=1.07;
    particles.visible=true;

    //플레이어 제거
    // scene.remove(heroSphere);
    // heroSphere.geometry.dispose();
    // heroSphere.material.dispose();
    // heroSphere = undefined;
}
function render(){
    renderer.render(scene, camera);
}
function gameover () {
    //explode();
    clock = undefined;
    //재시작 버튼 띄우기
    restartDom = document.getElementById("restart");
    restartDom.style.display = "inline";
}
function onWindowResize() {
    //scene 크기 조정
    sceneWidth = window.innerWidth - 1;
    sceneHeight = window.innerHeight - 2;
    renderer.setSize(sceneWidth, sceneHeight);
    camera.aspect = sceneWidth/sceneHeight;
    camera.updateProjectionMatrix();
}