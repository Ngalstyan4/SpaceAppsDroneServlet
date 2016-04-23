
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');
var redis = require("redis"),
    client = redis.createClient();
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use("/js/gc",express.static((__dirname + "/node_modules/game-controller")));
  app.use("/",express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
///###########################

 
client.on("error", function (err) {
    console.log("Error " + err);
});
 

///###########################
app.get('/getAllPos',function(req,res) {
  console.log("i1")
  var defaultPos = {
    lat:40.34,
    lon:44.7,
    velocity:20,
    heading:360
  };
  var drones = [];
  for(var i = 0;i<5;++i) {
      console.log("i2"+i)

      client.get("test",function(err,data) {
    if(data)
      drones.push(JSON.parse(data));
    else
    drones.push(defaultPos);
       
    if(i==4){
   
      console.log("i3 SENT")
}
  });
  setTimeout(function(){res.send(JSON.stringify(drones));},10)
  
  }

});
app.post('/setPos/*',function(req,res) {
  var splitedURL = req.url.split("/");
  var droneId = splitedURL[splitedURL.indexOf("setPos")+1];
    client.set(droneId,JSON.stringify(req.body));
  res.send("Position of <b/>"+droneId+"<b/> is set!");
  console.log("setPos",droneId,JSON.stringify(req.body));

});

app.get('/getPos/*',function(req,res) {
  var defaultPos = {
    lat:40.34,
    lon:44.7,
    velocity:20,
    heading:360
  };
  var splitedURL = req.url.split("/");
  var droneId = splitedURL[splitedURL.indexOf("getPos")+1];
  client.get(droneId,function(err,data) {
    console.log("getPos",err,data);
    if(data)
      res.send(JSON.parse(data));
    else
    res.send(defaultPos);
  });


});





app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
