import tornado.ioloop
import tornado.web
import tornado.websocket
import json
import time

players = {}

class MainHandler(tornado.web.RequestHandler):
	def get(self):
		self.write("Hello, world")

class EchoWebSocket(tornado.websocket.WebSocketHandler):
	def open(self):
		token = time.time()
		players[token] = {}
		players[token]["name"] = self.get_argument(u"player")
		self.write_message(json.dumps({"token": token}))

	def on_message(self, message):
		try:
			mex = json.loads(message)
			if mex[u"token"] in players:
				self.write_message({"status": "OK"})
		except:
			self.close()

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