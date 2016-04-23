goog.provide('Mavelous.NarekVehicle');

goog.require('goog.math');



/**
 * Very crude model of a vehicle - just enough to show the map working
 * offline.
 *
 * @param {{lat: number, lon: number}} properties Model properties.
 * @constructor
 * @extends {Backbone.Model}
 */
Mavelous.NarekVehicle = function(properties) {
  goog.base(this, properties);
};
goog.inherits(Mavelous.NarekVehicle, Backbone.Model);


/**
 * @override
 * export
 */
Mavelous.NarekVehicle.prototype.defaults = function() {
  return {
    'lat': 40.3302689,
    'lon': 44.2674446,
    'alt': 30,
    'heading': 90,
    'pitch': 0,
    'roll': 0,
    'velocity': 10,
    't': 0
  };
};


/**
 * @override
 * @export
 */
Mavelous.NarekVehicle.prototype.initialize = function() {
  var t = Date.now();
  this.firstupdate = t;
  this.lastupdate = t;
  this.lastmessagetime = t;
};


/**
 * Updates the vehicle state.
 */
Mavelous.NarekVehicle.prototype.update = function() {
  var tnow = Date.now();
  var dt = (tnow - this.lastupdate) / 1000;
  var t = (tnow - this.firstupdate) / 1000;
  var newposition = Mavelous.NarekVehicle.nextposition(this, dt);

  var c = this.toJSON();
  /* multiplied by a constant which is more or less eyeballed... */
  var deltaalt = (2 * dt * c['velocity'] *
                  Math.sin(goog.math.toRadians(c['pitch'])));
  var deltahead = (4 * dt * c['velocity'] *
                   Math.sin(goog.math.toRadians(c['roll'])));

  this.set({
    'lat': newposition['lat'],
    'lon': newposition['lon'],
    'alt': c['alt'] + deltaalt,
    'heading': c['heading'] + deltahead,
    /* pitch and roll follow a sinusoid */
    'pitch': 8 * Math.sin(t),
    'roll': 5 + 15 * Math.sin(t / 2),
    't': t
  });

  this.lastupdate = tnow;
};


/**
 * Updates fake MavlinkMessages.
 * @param {Object} msgModels The MavlinkMessages.
 * @return {Object} The newest messages.
 */
Mavelous.NarekVehicle.prototype.requestMessages = function(msgModels) {
  /* Throttle results to 5hz - give a non-error response either way,
   * but only increment the index above the expected if its been more
   * than 200ms since we last responded to the request. */
  var tnow = Date.now();
  var increment = (tnow - this.lastmessagetime) > 200;
  if (increment) { this.lastmessagetime = tnow; }

  var state = this.toJSON();
  var results = {};
  _.each(msgModels, function(mdl, name) {
    if (name in Mavelous.NarekVehicle.fakeHandlers) {
      var mdlidx = mdl.get('_index') || 0;
      results[name] = {
        index: (increment ? (mdlidx + 1) : mdlidx),
        msg: Mavelous.NarekVehicle.fakeHandlers[name](state)
      };
    }
  });
  return results;
};


/**
 * Creates a fake attitude object.
 * @param {Object} state Vehicle state.
 * @return {Object} Attitude.
 */
Mavelous.NarekVehicle.fakeAttitude = function(state) {
  return {
    'pitch': goog.math.toRadians(state['pitch']),
    'roll': goog.math.toRadians(state['roll'])
  };
};


/**
 * Creates a fake VFRHUD message.
 * @param {Object} state Vehicle state.
 * @return {Object} VFRHUD message.
 */
Mavelous.NarekVehicle.fakeVfrHud = function(state) {
  return {
    'heading': state['heading'],
    'alt': state['alt'],
    'airspeed': state['velocity']
  };
};


/**
 * Creates a fake NAV_CONTROLLER_OUTPUT message.
 * @param {Object} state Vehicle state.
 * @return {Object} NAV_CONTROLLER_OUTPUT message.
 */
Mavelous.NarekVehicle.fakeNavControllerOutput = function(state) {
  return {
    'alt_error': 30 - state['alt'],
    'aspd_error': 4 - state['velocity']
  };
};


/**
 * Creates a fake GPS_RAW_INT message.
 * @param {Object} state Vehicle state.
 * @return {Object} GPS_RAW_INT message.
 */
Mavelous.NarekVehicle.fakeGpsRawInt = function(state) {
  return {
    'fix_type': 3,
    'lat': Math.round(state['lat'] * 10e6),
    'lon': Math.round(state['lon'] * 10e6)
  };
};


/**
 * Creates a fake META_WAYPOINT message.
 * @param {Object} state Vehicle state.
 * @return {Object} META_WAYPOINT message.
 */
Mavelous.NarekVehicle.fakeMetaWaypoint = function(state) {
  /* Left intentionally empty */
  return {};
};


/**
 * Creates a fake HEARTBEAT message.
 * @param {Object} state Vehicle state.
 * @return {Object} HEARTBEAT message.
 */
Mavelous.NarekVehicle.fakeHeartbeat = function(state) {
  return {
    'type': 2, /* MAV_TYPE_QUADROTOR */
    'base_mode': 129, /* MAV_MODE_FLAG_CUSTOM_MODE_ENABLED = 1
                         | MAV_MODE_FLAG_SAFETY_ARMED = 128 */
    'custom_mode': 3 /* ArduCopter AUTO mode */
  };
};


/**
 * Creates a fake META_LINKQUALITY message.
 * @param {Object} state Vehicle state.
 * @return {Object} META_LINKQUALITY message.
 */
Mavelous.NarekVehicle.fakeMetaLinkquality = function(state) {
  return {
    'master_in': Math.floor(11 * state['t']),
    'master_out': Math.floor(9 * state['t']),
    'mav_loss': 0
  };
};


/**
 * Creates a fake GPS_STATUS message.
 * @param {Object} state Vehicle state.
 * @return {Object} GPS_STATUS message.
 */
Mavelous.NarekVehicle.fakeGpsStatus = function(state) {
  return { 'satellites_visible': 8 };
};


/**
 * Creates a fake STATUSTEXT message.
 * @param {Object} state Vehicle state.
 * @return {Object} STATUSTEXT message.
 */
Mavelous.NarekVehicle.fakeStatustext = function(state) {
  return { 'text': 'Offline mode' };
};


/**
 * Creates a fake SYS_STATUS message.
 * @param {Object} state Vehicle state.
 * @return {Object} SYS_STATUS message.
 */
Mavelous.NarekVehicle.fakeSysStatus = function(state) {
  /* Left intentionally empty */
  return {};
};


/**
 * Map from message types to functions that will create those
 * messages.
 */
Mavelous.NarekVehicle.fakeHandlers = {
  'ATTITUDE': Mavelous.NarekVehicle.fakeAttitude,
  'VFR_HUD': Mavelous.NarekVehicle.fakeVfrHud,
  'NAV_CONTROLLER_OUTPUT': Mavelous.NarekVehicle.fakeNavControllerOutput,
  'GPS_RAW_INT': Mavelous.NarekVehicle.fakeGpsRawInt,
  'META_WAYPOINT': Mavelous.NarekVehicle.fakeMetaWaypoint,
  'HEARTBEAT': Mavelous.NarekVehicle.fakeHeartbeat,
  'META_LINKQUALITY': Mavelous.NarekVehicle.fakeMetaLinkquality,
  'GPS_STATUS': Mavelous.NarekVehicle.fakeGpsStatus,
  'STATUSTEXT': Mavelous.NarekVehicle.fakeStatustext,
  'SYS_STATUS': Mavelous.NarekVehicle.fakeSysStatus
};


/**
 * Calculate destination point given start point, initial bearing
 * (deg) and distance (km).  See
 * http://williams.best.vwh.net/avform.htm#LL from
 * http://imedea.uib-csic.es/tmoos/gliders/administracion/documentacion/Javascript_Documentacion/overview-summary-latlon.js.html
 *
 * @param {Mavelous.NarekVehicle} model The vehicle model.
 * @param {number} dt The time step.
 * @return {Object} The new position.
 */
Mavelous.NarekVehicle.nextposition = function(model, dt) {
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
  return {
    'lat': goog.math.toDegrees(lat2),
    'lon': goog.math.toDegrees(lon2)
  };
};
