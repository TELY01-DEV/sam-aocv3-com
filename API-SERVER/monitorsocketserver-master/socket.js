const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sharedsession = require("express-socket.io-session");

const logger = require("morgan");

var adminRouter = require("./routers/admin.router");
const session = require("express-session");

// session
app.use(
  session({
    secret: "socketserver@123!",
    resave: true,
    saveUninitialized: true,
  })
);

// view engine setup
app.set("views", path.join(__dirname, "view"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

// app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const TCP_PORT = 4500;
const HTTP_PORT = 8000;
require("events").EventEmitter.defaultMaxListeners = 150;

app.use("/admin", adminRouter);
app.get("/:SerialNumber", function (req, res) {
  res.render("chart", { SerialNumber: req.params.SerialNumber });
});
app.get("/ecg/chartnew", function (req, res) {
  res.render("chartnew");
});

var httpserver = app.listen(HTTP_PORT);
var io = require("socket.io")(httpserver, {
  serveClient: true,
  cors: {
    origin: "*",
  },
});

io.use(
  sharedsession(
    session({
      secret: "socketserver@123!",
      resave: true,
      saveUninitialized: true,
    })
  )
);

var TCPclient = null;
var socketCount = 0;

function IsJsonString(str) {
  return new Promise((resolve, reject) => {
    try {
      JSON.parse(str);
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
}

io.on("connection", (socket) => {
  console.log("tcpCount: " + ++socketCount);
  setTimeout(() => {
    socket.emit("connection", "Server is ready.");
    if (!TCPclient || true) {
      try {
        TCPclient = new net.Socket();

        TCPclient.connect(TCP_PORT, function () {
          console.log("TCP Connected");
        });

        TCPclient.on("data", function (data) {
          IsJsonString(data)
            .then((res) => {
              var data_json = JSON.parse(data.toString());
              var roomname = String(data_json.SerialNumber);
              // console.log("data.toString()", data.toString());
              io.sockets.in(roomname).emit("data", data.toString());
            })
            .catch((error) => {
              // console.log(error);
            });
        });
      } catch (error) {
        console.log(error);
      }
    }

    socket.on("room_join", function (data) {
      console.log("Room Join", data, socket.id);
      socket.join(String(data));
      // io.sockets.in(data).emit('data', String(data)+' Room Join Successfully.');
    });

    socket.on("disconnect", function (data) {
      console.log("Socket Disconnect");
      if (socketCount == 1) TCPclient.destroy();
      else console.log("tcpCount: " + --socketCount);
    });
  }, 3000);
});

const net = require("net");
const { setTimeout } = require("timers");
const connectedSockets = new Set();
var connectionCount = 0;

// Create a server object
const server = net
  .createServer((socket) => {
    console.clear();
    console.log("connectionCount: " + ++connectionCount);

    // socket.write('Server is ready.');
    connectedSockets.add(socket);

    var chunk = "";
    socket.on("data", (data) => {
      var dataStr = data.toString();
      IsJsonString(dataStr)
        .then((res) => {
          // console.log("dataStr", dataStr);
          connectedSockets.broadcast(dataStr, socket);
        })
        .catch((error) => {
          chunk += dataStr;
          d_index = chunk.indexOf("\n");
          while (d_index > -1) {
            try {
              string = chunk.substring(chunk.indexOf("{"), d_index);
              if (
                string.includes('{"SerialNumber"') ||
                string.includes('{"serialnumber"')
              ) {
                connectedSockets.broadcast(string, socket);
              } else {
              }
            } catch (e) {
              console.log("Invalid Json", dataStr);
            }
            chunk = chunk.substring(d_index + 1);
            d_index = chunk.indexOf("\n");
          }
        });
    });

    // socket.end('SERVER: Closing connection now.<br>');
    socket.on("end", function () {
      console.log("Socket Disconnect: ");
      connectedSockets.delete(socket);
      console.log("connectionCount: " + --connectionCount);
    });

    socket.on("close", function () {
      console.log("Socket Closeconnection: ");
      connectedSockets.delete(socket);
      console.log("connectionCount: " + connectionCount);
    });

    socket.on("error", function (err) {
      console.log("Error: " + err.message);
    });
  })
  .on("error", (err) => {
    console.error(err);
  });

var diff = 0;

connectedSockets.broadcast = function (data, except) {
  for (let socket of this) {
    if (socket !== except) {
      try {
        //console.log("===========================================", data);
        socket.write(data);
      } catch (error) {
        console.log("error", error);
      }
    }
  }
};

// Open server on port
server.listen(TCP_PORT, () => {
  console.log("opened server on", server.address().port);
});
