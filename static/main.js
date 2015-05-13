function Player(player, maprange){
	var ws = new WebSocket("ws://"+location.host+"/websocket?player="+player);
	ws.onopen = function() {
	};
	window.addEventListener("beforeunload", function(){ws.close()});
	var send = function(object){
			object.token = ws.token;
			ws.send(JSON.stringify(object))
	}
	var values = {x:maprange/2, y:maprange/2, size:10, speed: 10, direction: {}, maprange:maprange};
	var p = {ws: ws, send: send, move: move, values: values, maprange:maprange, color:"#ff0000"};
	var move = function(){
		values.x = values.x || 0;
		values.y = values.y || 0;
		values.x += p.direction.x * values.speed;
		values.y += p.direction.y * values.speed;
		if (values.x<0) values.x=0;
		if (values.y<0) values.y=0;
		if (values.x>maprange) values.x=maprange;
		if (values.y>maprange) values.y=maprange;
	}
	p.move = move;
	var poll = function(){
		values.direction = p.direction;
		values.color = p.color;
		delete values.size;
		move();
		send(values);
		return setTimeout(poll, 100);
	}; var started;
	ws.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if ("token" in data){
			ws.token = data.token;
			send(values);
		} else {
			p.others = data;
			p.values = data[ws.token];
			eat(p, data);
			if(!started) started = poll();
		}
	};
	return p;
}

function Glass(id, player){
	var canvas = document.getElementById(id);
	var ctx = canvas.getContext("2d");
	var fullscreen = function(){
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};
	window.addEventListener("resize", fullscreen);
	fullscreen();
	canvas.addEventListener("mousemove", function(e){
		player.direction = normalize(mousePositionElementCenter(e));
	});
			
	var drawCell = function(player){
		ctx.fillStyle = player.color;
		ctx.beginPath();
			ctx.arc(player.x,player.y,player.size,0,2*Math.PI);
		ctx.fill();
		ctx.fillStyle = "#000000";
		ctx.fillText(player.name, player.x, player.y);
	}
	var noise = document.getElementById("noise");
	var drawWorld = function(players){
		ctx.clearRect(0,0,canvas.width, canvas.height);
		ctx.save();
		try {
			var scale = 1-(player.values.size-10)/window.innerWidth;
			ctx.scale(scale, scale);
		} catch(e){};
		ctx.translate(-(player.values.x-player.maprange/2)+(window.innerWidth/2-player.maprange/2),
					  -(player.values.y-player.maprange/2)+(window.innerHeight/2-player.maprange/2));
		for (i in players){
			drawCell(players[i]);
		}
		ctx.strokeRect(0,0,player.maprange, player.maprange);
		ctx.restore();
	}
	return {canvas: canvas, ctx: ctx, drawCell: drawCell, drawWorld:drawWorld};
}

function init(){
	nickname = prompt("nickname")
	player = Player(nickname,512);
	glass = Glass("glass", player);
	var drawit = function(){
		glass.drawWorld(player.others);
		window.requestAnimationFrame(drawit);
	};
	drawit();	
};

function eat(p, others){
	var ws = p.ws;
	m = others[ws.token]
	for (i in others){
		var o = others[i];
		if (incircle(m.x, m.y, m.size, o.x, o.y) & ((m.size-(o.size*1.1))>0)){
			console.log("eat "+o.name);
			p.send({eat: i});
		}
		if (incircle(o.x, o.y, o.size, m.x, m.y) & ((o.size-(m.size*1.1))>0)){
			alert("gameover")
		}
	}
}