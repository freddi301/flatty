function Player(name){
	var p = {};
	p.ws = new WebSocket("ws://"+location.host+"/websocket?name="+name);
	p.ws.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if ("token" in data){
			p.token = data.token;
			p.pullDirection();
		} else {
			console.log(data);
		}
	}
	p.send = function(object){
		object.token = p.token;
		p.ws.send(JSON.stringify(object));
	}
	p.pullDirection = function(){
		p.send({direction: p.direction});
		setTimeout(p.pullDirection, 300);
	}
	return p;
}

function Glass(id, player){
	var g = {};
	g.player = player;
	g.canvas = document.getElementById(id);
	g.ctx = g.canvas.getContext("2d");
	g.fullscreen = function(){
		g.canvas.width = window.innerWidth;
		g.canvas.height = window.innerHeight;
	};
	window.addEventListener("resize", g.fullscreen);
	g.fullscreen();
	g.canvas.addEventListener("mousemove", function(e){
		g.player.direction = mousePositionElementCenter(e);
	});
	return g;
}

function init(){
	p = Player("fred");
	g = Glass("glass", p);
}