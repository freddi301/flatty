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
	return Object.create({}, {
		ws: {value: ws},
		send: {value: function(object){ object.token = this.ws.token; this.ws.send(JSON.stringify(object))}},
	});
}