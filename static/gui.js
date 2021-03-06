function initRanking(g){
	var table = $("<table>").addClass("ranking").appendTo("body");
	var update = function(){
		table.empty();
		var ordered = [];
		for (i in g.player.others){
			var player = g.player.others[i];
			ordered.push({name: player.name, mass: player.mass});
			ordered.sort(function(a,b){return b.mass-a.mass});
		}
		for (i in ordered){
			var player = ordered[i];
			var tr = $("<tr>");
				tr.append($("<td>").text(player.name));
				tr.append($("<td>").text(player.mass));
			table.append(tr);
		}
	}
	update();
	setInterval(update, 5000);
}

function initLog(){
	$("<div>", {id: "flattylog"}).appendTo($("body"));
}

function initGui(g){
	initRanking(g);
	initLog();
	$(".commandHelp").addClass("show");
}

function flattyLog(text){
	var flattylog = $("#flattylog");
	$("<p>").text(text).appendTo($("#flattylog"));
	flattylog.scrollTop(flattylog[0].scrollHeight);
}
