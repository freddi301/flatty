import tornado.ioloop
import tornado.web
import tornado.websocket

import threading
import json
import math
import time

def incircle(cx, cy, r, x, y):
	return pow(x - cx, 2) + pow(y - cy, 2) < pow(r,2)

def area2radius(area):
	return math.sqrt(area/math.pi)

def normalize(numbers):
	greatest = max(numbers)
	return [i/greatest for i in numbers]

class Glass:
	def __init__(self, radius):
		self.radius = radius
		self.cells = {}
	def newCell(self, token, name, socket):
		self.cells[token] = Cell(name, socket)
	def computeWorld(self):
		for cell in self.cells.itervalues():
			cell.move()
			self.broadcastWorld()
	def processMessage(self, message):
		if u"token" in message:
			cell = self.cells[message[u"token"]]
			if u"direction" in message:
				direction = message[u"direction"]
				cell.direction = normalize((direction[u"x"], direction[u"y"]))
		else:
			print("no token in message")
	def sendWorld(self, cell, world):
		cell.socket.write_message(world)
	def broadcastWorld(self):
		world = json.dumps([cell.state() for cell in self.cells.values()])
		for cell in self.cells.values():
			t = threading.Thread(target=self.sendWorld, args = (cell,world))
			t.daemon = True
			t.start()
		t = threading.Timer(0.3, self.broadcastWorld)
		t.start()
	
class Cell:
	def __init__(self, name, socket):
		self.name = name
		self.x = 0
		self.y = 0
		self.mass = 100
		self.direction = (0, 0)
		self.socket = socket
	def radius(self):
		return area2radius(self.mass)
	def speed(self):
		return 1000/self.mass
	def move(self):
		x_direction, y_direction = self.direction
		speed = self.speed()
		self.x += x_direction * speed
		self.y += y_direction * speed
	def state(self):
		return {
			u"name":self.name,
			u"x":self.x,
			u"y":self.y,
			u"mass":self.mass,
			u"direction": {
				u"x": self.direction[0],
				u"y": self.direction[1],
			}
		}

glass = Glass(512)
		
class EchoWebSocket(tornado.websocket.WebSocketHandler):
	def open(self):
		global glass
		token = str(time.time())
		name = self.get_argument(u"name",u"unnamed")
		glass.newCell(token, name, self)
		self.write_message(json.dumps({u"token": token}))

	def on_message(self, message):
		mex = json.loads(message)
		glass.processMessage(mex)

application = tornado.web.Application([
		(r"/websocket", EchoWebSocket),
		(r"/(.*)", tornado.web.StaticFileHandler, {"path": "static"}),
])

if __name__ == "__main__":
	glass.broadcastWorld()
	application.listen(80)
	tornado.ioloop.IOLoop.instance().start()