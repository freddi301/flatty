import tornado.ioloop
import tornado.web
import tornado.websocket
import json
import time
import random
import traceback

players = {}
seed = 0

class MainHandler(tornado.web.RequestHandler):
	def get(self):
		self.write("Hello, world")

class EchoWebSocket(tornado.websocket.WebSocketHandler):
	def open(self):
		token = str(time.time())
		players[token] = {}
		players[token]["name"] = self.get_argument(u"player")
		players[token][u"size"] = 10
		self.write_message(json.dumps({"token": token}))

	def on_message(self, message):
		mex = json.loads(message)
		try:
			if mex[u"token"] in players:
				global seed
				seed = (seed+1)%100
				if u"eat" in mex:
					players[mex[u"token"]][u"size"] += players[mex[u"eat"]][u"size"]/players[mex[u"token"]][u"size"]
					del players[mex[u"eat"]]
				else:
					players[str(seed)] = {u"x": random.randint(0, mex[u"maprange"]), u"y": random.randint(0, mex[u"maprange"]), u"size": 3, u"name":"", u"color":"#00FF00"}
					players[mex[u"token"]].update(mex)
					self.write_message(json.dumps(players))
		except:
			traceback.print_exc()

	def on_close(self):
		token = self.get_argument(u"player")
		if (token) in players:
			del players[token]	

application = tornado.web.Application([
		(r"/", MainHandler),
		(r"/websocket", EchoWebSocket),
		(r"/(.*)", tornado.web.StaticFileHandler, {"path": "static"}),
])

if __name__ == "__main__":
	application.listen(80)
	tornado.ioloop.IOLoop.instance().start()