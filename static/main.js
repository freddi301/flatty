function Player(player){
	var ws = new WebSocket("ws://localhost/websocket?player="+player);
	ws.onopen = function() {
	};
	ws.onmessage = function (e) {
		var data = JSON.parse(e.data);
		console.log(data);
		if ("token" in data){
			ws.token = data.token;
		}
	};
	var send = function(object){
			object.token = ws.token;
			ws.send(JSON.stringify(object))
	}
	var values = {x:0, y:0, size:300, speed:3, direction: {}};
	var move = function(){
			values.x = values.x || 0;
			values.y = values.y || 0;
			values.x += values.direction.x * values.speed;
			values.y += values.direction.y * values.speed;
	}
	setInterval(function(){move()}, 100);
	return {ws: ws, send: send, move: move, values: values};
}

function Glass(id, player){
	var canvas = document.getElementById(id);
	var ctx = canvas.getContext("2d");
	
	canvas.addEventListener("mousemove", function(e){
		player.values.direction = normalize(mousePositionElementCenter(e));
	});
	
	var drawCell = function(player){
		var delta = player.size/2;
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(player.x-delta,player.y-delta,delta,delta);
	}
	
	var drawWorld = function(players){
		ctx.clearRect(-2000, -2000, 4000, 4000);
		for (i in players){
			drawCell(players[i].values);
		}
	}
	
	return {ctx: ctx, drawCell: drawCell, drawWorld:drawWorld};
}

function init(){
	player = Player("fred");
	glass = Glass("glass", player);
	var drawit = function(){
		glass.drawWorld([player]);
		window.requestAnimationFrame(drawit);
	};
	drawit();	
};