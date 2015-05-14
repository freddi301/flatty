import tornado.ioloop
import tornado.web
import tornado.websocket

import threading
import random
import json
import math
import time

UPDATERATE = 0.3

def incircle(cx, cy, r, x, y):
	return pow(x - cx, 2) + pow(y - cy, 2) < pow(r,2)

def area2radius(area):
	return math.sqrt(area/math.pi)

def absolute(numbers):
	for number in numbers:
		yield abs(number)

def normalize(numbers):
	greatest = max(absolute(numbers))
	return [i/greatest for i in numbers]

class Glass:
	def __init__(self, radius):
		self.radius = radius
		self.cells = {}
		self.seeds = {}
		self.cellsLock = threading.RLock();
	def newCell(self, token, name, socket, cellid):
		cell = Cell(name, socket, self.radius, token, self, cellid)
		with self.cellsLock:
			self.cells[cell.cellid] = cell
	def computeWorld(self):
		for cell in self.cells.values():
			cell.move()
		self.seeds.update(self.genSeeds())
		self.broadcastWorld()
		t = threading.Timer(UPDATERATE, self.computeWorld)
		t.start()
	def processMessage(self, message):
		if (u"token" in message) & (u"id" in message):
			try:
				cell = self.cells[message[u"id"]]
				if cell.token != message[u"token"]: return
				if u"direction" in message:
					direction = message[u"direction"]
					cell.direction = normalize((direction[u"x"], direction[u"y"]))
					if u"extra" in message[u"direction"]:
						if message[u"direction"][u"extra"] == u"sprint":
							cell.sprint = True
				elif u"eatseed" in message:
					cell.eatseed(message[u"eatseed"])
				elif u"eatcell" in message:
					cell.eatcell(message[u"eatcell"])
			except:
				pass
				
	def sendWorld(self, cell, world):
		try:
			cell.socket.write_message(world)
		except tornado.websocket.WebSocketClosedError:
			pass
			
	def broadcastWorld(self):
		cells = {cell.cellid:cell.state() for cell in self.cells.values()}
		world = json.dumps({u"cells":cells, u"seeds":self.seeds})
		with self.cellsLock:
			for cell in self.cells.values():
				t = threading.Thread(target=self.sendWorld, args = (cell,world))
				t.daemon = True
				t.start()
			
	def genSeeds(self):
		left = 10*len(self.cells)-len(self.seeds)
		now = str(int(time.time()))
		return { now+str(i): {
				 u"x": random.randint(0, self.radius),
				 u"y": random.randint(0, self.radius),
				 u"mass": random.randint(5, 25)}
				for i in range(left)}
	
class Cell:
	def __init__(self, name, socket, enclojure, token, glass, cellid):
		self.name = name
		self.x = random.randint(0, glass.radius)
		self.y = random.randint(0, glass.radius)
		self.mass = 100
		self.direction = (0, 0)
		self.socket = socket
		self.enclojure = enclojure
		self.token = token
		self.glass = glass
		self.cellid = cellid
		self.sprint = False
	def radius(self):
		return area2radius(self.mass)
	def speed(self):
		return 100/self.radius()
	def move(self):
		x_direction, y_direction = self.direction
		speed = self.speed()
		if self.sprint and self.mass>100:
			speed = 10+self.speed()+self.radius()
			self.mass = self.mass*0.9 - 10
			self.sprint = False
		self.x += x_direction * speed
		self.y += y_direction * speed
		if self.x<0: self.x = 0
		if self.y<0: self.y = 0
		if self.x>self.enclojure: self.x = self.enclojure
		if self.y>self.enclojure: self.y = self.enclojure
	def eatseed(self, seedid):
		try:
			seed = self.glass.seeds[seedid]
			if incircle(self.x, self.y, self.radius()+self.speed(), seed[u"x"], seed[u"y"]):
				self.mass += seed[u"mass"]
				del self.glass.seeds[seedid]
		except:
			pass
	def eatcell(self, cellid):
		cell = self.glass.cells[cellid]
		if True: #incircle(self.x, self.y, self.radius(), cell.x, cell.y) & self.mass > cell.mass:
			self.mass += cell.mass
			with self.glass.cellsLock:
				del self.glass.cells[cellid]
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
		cellid = str(time.time())
		token = cellid+str(random.randint(0,99))
		name = self.get_argument(u"name",u"unnamed")
		cell = glass.newCell(token, name, self, cellid)
		self.write_message(json.dumps({u"token": token, u"id": cellid, u"enclojure": glass.radius}))

	def on_message(self, message):
		mex = json.loads(message)
		glass.processMessage(mex)

application = tornado.web.Application([
		(r"/websocket", EchoWebSocket),
		(r"/(.*)", tornado.web.StaticFileHandler, {"path": "static"}),
])

if __name__ == "__main__":
	glass.computeWorld()
	application.listen(80)
	tornado.ioloop.IOLoop.instance().start()