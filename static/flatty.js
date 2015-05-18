var UPDATERATE = 300;

function Player(name, color){
	var p = {};
	p.name = name;
	p.ws = new WebSocket("ws://"+location.host+"/websocket?name="+name+"&color="+color);
	p.ws.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if ("token" in data){
			p.token = data.token;
			p.id = data.id
			p.enclojure = data.enclojure;
			UPDATERATE = data.updaterate;
			p.pullDirection();
			p.listenCommands();
		} else {
			p.lastOthers = p.others || data.cells;
			p.others = data.cells; mapradius(p.others); mapspeed(p.others);
			p.seeds = data.seeds; mapradius(p.seeds);
			p.lastUpdate = new Date().valueOf();
			p.lastMe = p.me || p.others[p.id];
			p.me = p.others[p.id];
			p.mines = data.mines;
			p.eatSeeds();
			p.eatOthers();
			p.mineOthers();
		}
	}
	p.send = function(object){
		object.token = p.token;
		object.id = p.id;
		p.ws.send(JSON.stringify(object));
	}
	p.pullDirection = function(){
		if (p.direction) {
			p.direction.extra = p.extra;
			p.extra = null;
		}
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
	p.mineOthers = function(){
		var mine = p.mines[p.id];
		if (!mine) return;
		for (i in p.others){
			if (incircle(mine.x, mine.y, 4+p.others[i].radius, p.others[i].x, p.others[i].y)){
				p.send({minecell: i});
			}
		}
	}
	p.listenCommands = function(){
		window.addEventListener("keydown", function(e){
			var c = String.fromCharCode(e.keyCode);
			if (c==" ") p.extra = "sprint";
			else if (c=="E") p.extra = "mine";
			else if (c=="R") p.extra = "immaterial";
			else if (c=="T") p.extra = "invisible";
			else if (c=="B") p.extra = "blink"
		});
		window.addEventListener("keyup", function(){
			//p.extra = null;
		})
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
		var playerWeight = (delta<UPDATERATE?delta:UPDATERATE)/UPDATERATE;
		var player = g.player.others[playerid];
		var lastPlayerWeight = 1 - playerWeight;
		var lastPlayer = g.player.lastOthers[playerid];
		g.ctx.save();
		try {
		var x, y;
		g.ctx.beginPath();
			g.ctx.arc(
				x=(player.x*playerWeight+lastPlayer.x*lastPlayerWeight),
				y=(player.y*playerWeight+lastPlayer.y*lastPlayerWeight),
				(player.radius),
				0,2*Math.PI);
		g.ctx.globalAlpha=player.alpha;
		g.ctx.fillStyle = "#"+player.color;
		g.ctx.fill();
		//g.ctx.clip();
		g.ctx.strokeStyle = "white";
		g.ctx.lineWidth = 1;
		g.ctx.stroke();
		g.ctx.font = player.radius+"px Arial";
		g.ctx.fillStyle = "rgb(255,255,255)";
		g.ctx.fillText(player.name, x-player.radius, y+player.radius/2);
		} catch(e){};
		g.ctx.restore();
	}
	g.drawWorld = function(){
		g.ctx.save();
		g.ctx.fillStyle = "rgba(0,0,0.5)";
		g.ctx.fillRect(0,0,window.innerWidth, window.innerHeight);
		g.ctx.translate(window.innerWidth/2, window.innerHeight/2);
		var halfglass = g.player.enclojure/2;
		var delta = new Date().valueOf() - g.player.lastUpdate;
		if (g.player.me){
			var scaleLast = (window.innerHeight*0.1)/(g.player.lastMe.radius*2);
			var scale = (window.innerHeight*0.1)/(g.player.me.radius*2);
			var meWeight = delta/UPDATERATE;
			var lastMeWeight = 1 - meWeight;
			var smoothscale;
			g.ctx.scale(smoothscale=scale*meWeight+scaleLast*lastMeWeight,smoothscale);
			g.ctx.translate(
				-(g.player.me.x*meWeight+g.player.lastMe.x*lastMeWeight-halfglass)+(-halfglass),
				-(g.player.me.y*meWeight+g.player.lastMe.y*lastMeWeight-halfglass)+(-halfglass));
		}
		g.ctx.save();
			g.ctx.strokeStyle = "rgb(255,255,255)";
			g.ctx.lineWidth = 0.1;
			for (var x = 0; x<g.player.enclojure; x+=10){
				g.ctx.moveTo(x,0);
				g.ctx.lineTo(x,g.player.enclojure);
			}
			for (var y = 0; y<g.player.enclojure; y+=10){
				g.ctx.moveTo(0,y);
				g.ctx.lineTo(g.player.enclojure, y);
			}
			g.ctx.stroke();
		g.ctx.restore();
		for (i in g.player.others){
			g.drawCell(i, delta);
		}
		for (i in g.player.seeds){
			g.drawSeed(g.player.seeds[i]);
		}
		for (i in g.player.mines){
			g.drawMine(g.player.mines[i]);
		}
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
		g.ctx.fillStyle = seed.color;
		g.ctx.fill();
		g.ctx.lineWidth = 0.4;
		g.ctx.strokeStyle = "rgba(255,255,255,0.8)";
		g.ctx.stroke();
		g.ctx.restore();
	}
	g.drawMine = function(mine){
		g.ctx.save();
		g.ctx.translate(mine.x, mine.y);
		g.ctx.beginPath();
			g.ctx.moveTo(0,-4);
			g.ctx.lineTo(4,0);
			g.ctx.lineTo(0,4);
			g.ctx.lineTo(-4,0);
			g.ctx.lineTo(0,-4);
		g.ctx.strokeStyle = "white";
		g.ctx.stroke();
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
	var color = prompt("color RRGGBB"); color = color || "00FF00";
	p = Player(nickname, color);
	g = Glass("glass", p);
	initGui(g);
}