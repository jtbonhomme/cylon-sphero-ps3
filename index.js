var Cylon = require('cylon');

Cylon.robot({
  name: "MySphero",

  connections: {
    sphero: { adaptor: 'sphero', port: '/dev/tty.Sphero-PWR-AMP-SPP' },
    joystick: { adaptor: 'joystick' }
  },

  devices: {
    sphero: { driver: 'sphero', connection: 'sphero' },
    controller: { driver: 'dualshock-3', connection: 'joystick' }
  },

  config: {
    offset:   0.08,
    maxSpeed: 250
  },

  speed: function(x, y) {
    return Math.round(this.config.maxSpeed*Math.min(1, Math.sqrt(Math.pow((Math.abs(x)<this.config.offset?0:x),2)+Math.pow((Math.abs(y)<this.config.offset?0:y),2))));
  },

  angle: function(x, y) {
    if( Math.abs(x)<this.config.offset && Math.abs(y)<this.config.offset)
      return 0;
    if( x > 0 && y > 0)
      return Math.ceil(Math.asin(y)*180/Math.PI);
    if( x > 0 && y < 0)
      return Math.ceil(Math.asin(y)*180/Math.PI+360);
    if( x < 0 )
      return Math.ceil(Math.acos(y)*180/Math.PI+90);
  },

  work: function(my) {
    var color      = 0x00FF00,
        x          = 0,
        y          = 0;

    ["square", "circle", "x", "triangle"].forEach(function(button) {
      my.controller.on(button + ":press", function() {
        if( button === "circle") {
          // start calibration
          console.log("Button " + button + " pressed. Start calibration ...");
          my.sphero.startCalibration();
        }
      });

      my.controller.on(button + ":release", function() {
        if( button === "circle") {
          // finish calibration
          console.log("Button " + button + " released. Calibration finished.");
          my.sphero.finishCalibration();
        }
      });
    });


    my.controller.on("left_x:move", function(pos) {
      x = pos;
      color = my.speed(x,y),
      my.sphero.setRGB(color);
      my.sphero.roll(my.speed(x,y), my.angle(-y,x));
    });

    my.controller.on("left_y:move", function(pos) {
      y = pos;
      color = my.speed(x,y),
      my.sphero.setRGB(color);
      my.sphero.roll(my.speed(x,y), my.angle(-y,x));
    });

    my.sphero.detectCollisions();

    // auto calibrate sphero: no calibration, position [0;0], angle 0
    my.sphero.configureLocator(0, 0, 0, 0);

    // To detect locator, accelOne and velocity from the sphero
    // we use setDataStreaming.
    // sphero API data sources for locator info are as follows:
    // ["locator", "accelOne", "velocity"]
    // It is also possible to pass an opts object to setDataStreaming():
    var opts = {
      // n: int, divisor of the max sampling rate, 400 hz/s
      // n = 40 means 400/40 = 10 data samples per second,
      // n = 200 means 400/200 = 2 data samples per second
      n: 200,
      // m: int, number of data packets buffered before passing to the stream
      // m = 10 means each time you get data it will contain 10 data packets
      // m = 1 is usually best for real time data readings.
      m: 1,
      // pcnt: 1 -255, how many packets to send.
      // pcnt = 0 means unlimited data Streaming
      // pcnt = 10 means stop after 10 data packets
      pcnt: 0,
    };

    my.sphero.setDataStreaming(["locator", "accelOne", "velocity", "motorsPWM", "motorsIMF", "quaternion", "imu", "accelerometer", "gyroscope"], opts);

    // event handlers
    my.sphero.on('error', function() {
      console.log('error');
    });

    my.sphero.on('locator', function() {
      console.log('locator');
    });

    my.sphero.on('start', function() {
      console.log('start');
    });

    my.sphero.on('connect', function() {
      console.log('connect');
    });

    my.sphero.on('notification', function(data) {
//      console.log('notification : ' + JSON.stringify(data));
    });

    my.sphero.on('message', function(data) {
//      console.log('message : ' + data);
    });

    my.sphero.on('data', function(data) {
//      console.log('data : ' + data);
    });

    my.sphero.on('disconnect', function() {
      console.log('disconnect');
    });

    my.sphero.on('update', function(data) {
//      console.log("Update event eventName: " + data + " ");
//      console.log("Update event args: ");
//      console.log(data);
    });

    my.sphero.on('collision', function(data) {
      my.sphero.stop();
      console.log("collision : " + JSON.stringify(data));
      color = 0xFF0000,
      console.log("Change color : " + (color.toString(16)) + " ");
      my.sphero.setRGB(color);
    });
  }
});

Cylon.start();
