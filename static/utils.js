// Which HTML element is the target of the event
function mouseTarget(e) {
	var targ;
	if (!e) var e = window.event;
	if (e.target) targ = e.target;
	else if (e.srcElement) targ = e.srcElement;
	if (targ.nodeType == 3) // defeat Safari bug
		targ = targ.parentNode;
	return targ;
}
 
// Mouse position relative to the document
// From http://www.quirksmode.org/js/events_properties.html
function mousePositionDocument(e) {
	var posx = 0;
	var posy = 0;
	if (!e) {
		var e = window.event;
	}
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	}
	else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}
	return {
		x : posx,
		y : posy
	};
}
 
// Find out where an element is on the page
// From http://www.quirksmode.org/js/findpos.html
function mouseFindPos(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return {
		left : curleft,
		top : curtop
	};
}
 
// Mouse position relative to the element
// not working on IE7 and below
function mousePositionElement(e) {
	var mousePosDoc = mousePositionDocument(e);
	var target = mouseTarget(e);
	var targetPos = mouseFindPos(target);
	var posx = mousePosDoc.x - targetPos.left;
	var posy = mousePosDoc.y - targetPos.top;
	return {
		x : posx,
		y : posy
	};
}

function mousePositionElementCenter(e){
	var pos = mousePositionElement(e);
	var target = mouseTarget(e);
	var x = pos.x - target.offsetWidth/2;
	var y = pos.y - target.offsetHeight/2;
	return {x:x, y:y}
}

function normalize(o){
	var values = []
	for (i in o){
		values.push(Math.abs(o[i]));
	}
	var max = Math.max.apply(null, values);
	var ret = {};
	for (i in o){
		ret[i] = o[i]/max;
	}
	return ret;
}

function incircle(cx, cy, r, x, y){return Math.pow(x - cx, 2) + Math.pow(y - cy, 2) < Math.pow(r,2)}

function area2radius(area){return Math.sqrt(area/Math.PI)}

function mapradius(elems){
	for (i in elems){
		elems[i].radius = area2radius(elems[i].mass);
	}
}

function cell2speed(cell){
	return 100/cell.radius;
}

function mapspeed(elems){
	for (i in elems){
		elems[i].speed = cell2speed(elems[i]);
	}
}

function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1);
		if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
	}
	return null;
}