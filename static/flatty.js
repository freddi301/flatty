function Player(name){
	var p = {};
	p.name = name;
	p.ws = new WebSocket("ws://"+location.host+"/websocket?name="+name);
	p.ws.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if ("token" in data){
			p.token = data.token;
			p.enclojure = data.enclojure;
			p.pullDirection();
		} else {
			p.others = data;
			p.lastUpdate = new Date().valueOf();
			p.me = p.findMe();
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
	p.findMe = function(){
		for (i in p.others){
			if (p.others[i].name == name) return p.others[i]
		}
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
	g.drawCell = function(player, delta){
		var speed = 1000/player.mass; speed = speed*(delta/300);
		g.ctx.save();
		g.ctx.beginPath();
			g.ctx.arc(
				(player.x+player.direction.x*speed),
				(player.y+player.direction.y*speed),
				area2radius(player.mass),
				0,2*Math.PI);
		g.ctx.fill();
		g.ctx.restore();
	}
	g.drawWorld = function(players){
		g.ctx.save();
		g.ctx.clearRect(0,0,g.canvas.width, g.canvas.height);
		var halfglass = g.player.enclojure/2;
		var delta = new Date().valueOf() - g.player.lastUpdate;
		if (g.player.me){
			var speed = 1000/g.player.me.mass; speed = speed*(delta/300);
			g.ctx.translate(
				-(g.player.me.x-halfglass+g.player.me.direction.x*speed)+(window.innerWidth/2-halfglass),
				-(g.player.me.y-halfglass+g.player.me.direction.y*speed)+(window.innerHeight/2-halfglass));
		}
		for (i in players){
			g.drawCell(players[i], delta);
		}
		g.ctx.strokeRect(0,0,g.player.enclojure, g.player.enclojure);
		g.ctx.restore();
	}
	g.animate = function(){
		g.drawWorld(g.player.others, g.player.lastOthers);
		window.requestAnimationFrame(g.animate);
	}
	g.animate();
	return g;
}

function init(){
	var nickname = prompt("nickname");
	p = Player(nickname);
	g = Glass("glass", p);
}