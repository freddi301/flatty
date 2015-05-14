var UPDATERATE = 300;

function Player(name){
	var p = {};
	p.name = name;
	p.ws = new WebSocket("ws://"+location.host+"/websocket?name="+name);
	p.ws.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if ("token" in data){
			p.token = data.token;
			p.id = data.id
			p.enclojure = data.enclojure;
			p.pullDirection();
		} else {
			p.lastOthers = p.others || data.cells;
			p.others = data.cells; mapradius(p.others); mapspeed(p.others);
			p.seeds = data.seeds; mapradius(p.seeds);
			p.lastUpdate = new Date().valueOf();
			p.lastME = p.me || p.others[p.id];
			p.me = p.others[p.id];
			p.eatSeeds();
			p.eatOthers();
		}
	}
	p.send = function(object){
		object.token = p.token;
		object.id = p.id;
		p.ws.send(JSON.stringify(object));
	}
	p.pullDirection = function(){
		p.send({direction: p.direction});
		setTimeout(p.pullDirection, UPDATERATE);
	}
	p.eatSeeds = function (){
		for (i in p.seeds){
			if (incircle(p.me.x, p.me.y, p.me.radius+p.me.speed, p.seeds[i].x, p.seeds[i].y)){
				p.send({eatseed: i});
			}
		}
	}
	p.eatOthers = function(){
		for (i in p.others){
			if (incircle(p.me.x, p.me.y, p.me.radius, p.others[i].x, p.others[i].y) & p.me.mass > p.others[i].mass*1.1){
				p.send({eatcell: i});
			}
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
	g.drawCell = function(playerid, delta){
		var playerWeight = delta/UPDATERATE;
		var player = g.player.others[playerid];
		var lastPlayerWeight = 1 - playerWeight;
		var lastPlayer = g.player.lastOthers[playerid];
		g.ctx.save();
		g.ctx.beginPath();
			g.ctx.arc(
				(player.x*playerWeight+lastPlayer.x*lastPlayerWeight),
				(player.y*playerWeight+lastPlayer.y*lastPlayerWeight),
				(player.radius),
				0,2*Math.PI);
		g.ctx.fill();
		g.ctx.restore();
	}
	g.drawWorld = function(){
		g.ctx.save();
		g.ctx.clearRect(0,0,g.canvas.width, g.canvas.height);
		var halfglass = g.player.enclojure/2;
		var delta = new Date().valueOf() - g.player.lastUpdate;
		if (g.player.me){
			var meWeight = delta/UPDATERATE;
			var lastMeWeight = 1 - meWeight;
			g.ctx.translate(
				-(g.player.me.x*meWeight+g.player.lastME.x*lastMeWeight-halfglass)+(window.innerWidth/2-halfglass),
				-(g.player.me.y*meWeight+g.player.lastME.y*lastMeWeight-halfglass)+(window.innerHeight/2-halfglass));
		}
		for (i in g.player.others){
			g.drawCell(i, delta);
		}
		for (i in g.player.seeds){
			g.drawSeed(g.player.seeds[i]);
		}
		g.ctx.strokeRect(0,0,g.player.enclojure, g.player.enclojure);
		g.ctx.restore();
	}
	g.drawSeed = function(seed){
		g.ctx.save();
		g.ctx.beginPath();
			g.ctx.arc(
				(seed.x),
				(seed.y),
				area2radius(seed.mass),
				0,2*Math.PI);
		g.ctx.fill();
		g.ctx.restore();
	}
	g.animate = function(){
		g.drawWorld();
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