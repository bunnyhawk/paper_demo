var values = {
  friction: 0.8,
  timeStep: 0.01,
  amount: 15,
  mass: 2,
  count: 0
};

values.invMass = 1 / values.mass;

var path, springs, logo;
var size = view.size * [1.2, 1];

var Spring = function (a, b, strength, restLength) {
  this.a = a;
  this.b = b;
  this.restLength = restLength || 80;
  this.strength = strength || 0.55;
  this.mamb = values.invMass * values.invMass;
};

Spring.prototype.update = function () {
  var delta = this.b - this.a;
  var dist = delta.length;
  var normDistStrength = (dist - this.restLength) /
    (dist * this.mamb) * this.strength;

  delta.y *= normDistStrength * values.invMass * 0.2;
  if (!this.a.fixed)
    this.a.y += delta.y;
  if (!this.b.fixed)
    this.b.y -= delta.y;
};

function createPath(strength) {
  var path = new Path({
    fillColor: 'black',
    // closed: true
  });

  springs = [];
  for (var i = 0; i <= values.amount; i++) {
    var segment = path.add(new Point(i / values.amount, 0.5) * size);
    var point = segment.point;
    if (i == 0 || i == values.amount) {
      point.y += size.height;
    }
    point.px = point.x;
    point.py = point.y;
    // The first two and last two points are fixed:
    point.fixed = i < 2 || i > values.amount - 2;
    if (point.fixed) {
      point.y = 0;
    }

    if (i > 0) {
      var spring = new Spring(segment.previous.point, point, strength);
      springs.push(spring);
    }
  }
  path.position.x -= size.width / 4;
  return path;
}

function onResize() {
  if (path) {
    path.remove();
  }

  size = view.bounds.size * [2, 1];
  path = createPath(0.1);

  pathHeight = (view.center / 2).y;

  logo.fitBounds(view.bounds);
}

var started = false;

function onMouseMove(event) {
  state = 2;

  if (!started) {
    for (var i = 1, amt = values.amount; i < amt; i++) {
      path.segments[i].point.y = view.center.y;
    }
    started = true;
  }

  var location = path.getNearestLocation(event.point);
  var segment = location.segment;
  var point = segment.point;

  if (!point.fixed && location.distance < size.height / 4) {
    var y = event.point.y;
    point.y += (y - point.y) / 6;
    if (segment.previous && !segment.previous.fixed) {
      var previous = segment.previous.point;
      previous.y += (y - previous.y) / 24;
    }
    if (segment.next && !segment.next.fixed) {
      var next = segment.next.point;
      next.y += (y - next.y) / 24;
    }
  }
}

var results = [];

var pathHeight = (view.center / 2).y;

var frameCount = 0;

function idle () {
  frameCount++;

  pathHeight += (view.center.y - pathHeight) / 10;

  for (var i = 1, amt = values.amount; i < amt; i++) {
    var sinSeed = frameCount + (i + i % 10) * 100;
    var sinHeight = Math.sin(sinSeed / 200) * pathHeight;
    var yPos = Math.sin(sinSeed / 100) * sinHeight + (view.size.height / 2);
    path.segments[i].point.y = yPos;
  }
}

var state = 1;

function onFrame (event) {
  if (results.length) {
    for (var i = 0, len = results.length; i < len; i++) {
      results[i].remove();
    }
  }

  if (state === 1) {
    idle();
  } else  {
    updateWave(path);
  }

  // if (logo && logo.children && logo.children.length > 0) {
    for (var j = 0, len = logo.children.length; j < len; j++) {
      results[j] = path.intersect(logo.children[j + 1]);
      results[j].fillColor = '#ffffff';
    }
  // }
  
  path.smooth({
    type: 'geometric'
  });

}

function updateWave (path) {

  var force = 1 - values.friction * values.timeStep * values.timeStep;
  for (var i = 0, len = path.segments.length; i < len; i++) {
    var point = path.segments[i].point;
    var dy = (point.y - point.py) * force;
    point.py = point.y;
    point.y = Math.max(point.y + dy, 0);
  }
  
  for (var j = 0, len = springs.length; j < len; j++) {
    springs[j].update();
  }
}

var acid = document.getElementById('my-svg');

logo = project.importSVG(acid);

logo.position = view.center;
logo.visible = true;
logo.closed = false;
logo.fillColor = 'black';