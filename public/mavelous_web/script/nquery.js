var nareksGlobalDrone;
setInterval(function() {
    go();
    console.log("updated");
},1000);
window.onkeyup = function(e) {
   var key = e.keyCode ? e.keyCode : e.which;
    if(key==38||key==87) {//KEY UP
        go("up");
    }
    if(key==40||key==83){
        go("down");
    }
    if(key==37||key==65) {
        go("left");
    }
    if(key==39||key==68) {
        go("right");
    }

};


function go(where) {
    var heading;
    var dx=0,dy=0;
    var delta = 0.0001;
    switch(where){
        case "up":
        dx+=delta;
        heading = 360;
        break;
        case"down":
        dx-=delta;
        heading = 180;
        break;
        case"left":
        dy-=delta;
        heading = 270;
        break;
        case"right":
        dy+=delta;
        heading = 90;
        break;
        default:
       // heading = 90;
        break;
        
    }
    var model = nareksGlobalDrone;
   // model.set({'velocity':50,heading:50});
    var dt = 1;
      var R = 6371; // earth's mean radius in km
  var lat1 = goog.math.toRadians(model.get('lat'));
  var lon1 = goog.math.toRadians(model.get('lon'));
  var brng = goog.math.toRadians(model.get('heading'));
  var d = (model.get('velocity') * dt) / 1000; // m to km

  var lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) +
                       Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
  var o = Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1);
  var a = Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2);
  var lon2 = lon1 + Math.atan2(o, a);
  // normalise to -180...+180
  lon2 = (lon2 + Math.PI) % (2 * Math.PI) - Math.PI;

  if (isNaN(lat2) || isNaN(lon2)) {
    throw new Error('nope');
  }
    var lat = nareksGlobalDrone.get("lat") - -dy;
    var lon = nareksGlobalDrone.get("lon")- -dx;
    var latLon = {
        'lat': goog.math.toDegrees(lat2),
        'lon': goog.math.toDegrees(lon2),
        'velocity':50,
        'heading':nareksGlobalDrone.get("heading")
    };
        
    nareksGlobalDrone.set(latLon);
      $.ajax({
    context: this,
    type: 'POST',
    cache: false,
    url: "/setPos/test/",
    data:latLon,
    datatype: 'json',
    success: function(data) {
        console.log(data);
    },
    error: function() {
console.log("error");
    }
  });
}