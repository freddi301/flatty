function initGui(g){
	var table = $("<table>").addClass("ranking").appendTo("body");
	var update = function(){ console.log("ranking up");
		table.empty();
		for (i in g.player.others){
			var player = g.player.others[i];
			var tr = $("<tr>");
				tr.append($("<td>").text(player.name));
				tr.append($("<td>").text(player.mass));
			table.append(tr);
		}
	}
	update();
	setInterval(update, 5000);
}