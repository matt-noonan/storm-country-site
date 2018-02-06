var c = document.getElementById("myCanvas");
var shapeSelector = document.getElementById("shapeSelector");
var ctx = c.getContext("2d");

var qed = false;

var tri = { "x": 0,
            "y": -150,
            "dx": 100,
            "dy": 200,
            "theta": 0.4 };

var dist = function(a, b, p, q) {
  return Math.sqrt((a-p)*(a-p) + (b-q)*(b-q));
};

var center = { "x": c.width / 2,
               "y": c.height / 2 };

var reflected = { "a": false, "b": false, "c": false };

var invader = {
  "width": 11,
  "height": 8,
  "data": [ [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0 ],
            [ 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0 ],
            [ 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0 ],
            [ 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0 ],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
            [ 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1 ],
            [ 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1 ],
            [ 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0 ] ] };

var grabbed = "";
var gdelta = {};

function diff(v, w) {
    return { "x" : v.x - w.x,
             "y" : v.y - w.y };
}

function dot(v, w) {
    return v.x * w.x + v.y * w.y;
}

function norm2(v) {
    return dot(v,v);
}

function norm(v) { return Math.sqrt(norm2(v)); };

function on_segment(v, w) {
    return function(t) {
        lhs = dot(diff(t,v), diff(w,v));
        rhs = norm2(diff(w,v));
        return lhs >= 0 && lhs <= rhs;
    };
}

function translate(v) {
    return function(w) {
        return { "x" : v.x + w.x,
                 "y" : v.y + w.y };
    };
}

function rotateO(theta) {
    return function(v) {
        return { "x" :  v.x * Math.cos(theta) + v.y * Math.sin(theta),
                 "y" : -v.y * Math.sin(theta) + v.x * Math.cos(theta) };
    };
}

function rotate(theta, c) {
    return function(v) {
        return translate(c)(rotateO(theta)(translate(-c)(v)));
    };
}

function rot90(v) {
    return { "x": -v.y, "y": v.x };
};

function rot90(v) {
    return { "x": -v.y, "y": v.x };
};

function corner(t) {
    return { "x": t.x, "y": t.y };
};

function vtx_a(t) {
    return { "x": t.x + t.dx * Math.cos(t.theta),
             "y": t.y + t.dx * Math.sin(t.theta) };
};

function vtx_b(t) {
    return { "x": t.x - t.dy * Math.sin(t.theta),
             "y": t.y + t.dy * Math.cos(t.theta) };
};

function foot_a(t) {
    return diff(vtx_a(t), corner(t));
}

function hypot(t) {
    return diff(vtx_b(t), vtx_a(t));
}

function foot_b(t) {
    return diff(corner(t), vtx_b(t));
}

var hit_radius = 10;

function near_line(v,w) {
    return function(t) {
        lhs1 = dot(diff(t,v), diff(w,v));
        lhs2 = dot(diff(t,v), rot90(diff(w, v)));
        rhs = norm2(diff(w,v));
        return lhs1 >= 0 && lhs1 <= rhs && Math.abs(lhs2) <= Math.sqrt(rhs)* (1.5 * hit_radius);
    };
};

function near_point(v) {
    return function(t) {
        return Math.sqrt(norm2(diff(v,t))) <= hit_radius;
    };
};

function onMouseDown(event) {
    var rect = c.getBoundingClientRect();
    var click = { "x": event.clientX - rect.left - center.x,
                  "y": event.clientY - rect.top  - center.y };

    hit_radius = 7;
    if (beginGrab(click)) {
        //event.stopPropagation();
        //event.preventDefault();
    }
};

function onTouchBegin(event) {
    var rect = c.getBoundingClientRect();
    var pt = { "x": event.changedTouches[0].clientX - rect.left - center.x,
               "y": event.changedTouches[0].clientY - rect.top  - center.y };

    hit_radius = 30;
    if (beginGrab(pt)) {
        //event.stopPropagation();
        //event.preventDefault();
    }
}

function beginGrab(click) {
    if (near_point(vtx_a(tri))(click)) {
        grabbed = "A";
    }
    else if (near_point(vtx_b(tri))(click)) {
        grabbed = "B";
    }
    else if (dot(rot90(foot_a(tri)), diff(click,corner(tri))) >= 0 &&
             dot(rot90(hypot(tri)),  diff(click, vtx_a(tri))) >= 0 &&
             dot(rot90(foot_b(tri)), diff(click, vtx_b(tri))) >= 0)
    {
        gdelta = diff(click, corner(tri));
        grabbed = "C";
    }
    
    if (grabbed) {
        redraw(ctx);
        return true;
    }
    return false;
};

function onMouseUp(event) {
    //event.stopPropagation();
    //event.preventDefault();
    var do_redraw = false;
    if (grabbed) {
        grabbed = "";
        do_redraw = true;
    }

    if (do_redraw) {
        redraw(ctx);
    }
};

in_drag = false;

function onMouseMove(event) {
    var rect = c.getBoundingClientRect();
    var mouse = { "x": event.clientX - rect.left - center.x,
                  "y": event.clientY - rect.top - center.y };
    if (doMove(mouse)) {
        event.stopPropagation();
        event.preventDefault();
    }
};

function onTouchMove(event) {
    var rect = c.getBoundingClientRect();
    var pt = { "x": event.changedTouches[0].clientX - rect.left - center.x,
               "y": event.changedTouches[0].clientY - rect.top  - center.y };
    if (doMove(pt)) {
        event.stopPropagation();
        event.preventDefault();
    }
}

function doMove(mouse) {
    do_redraw = false;
    
    if (grabbed == "C") {
        tri.x = mouse.x - gdelta.x;
        tri.y = mouse.y - gdelta.y;
        do_redraw = true;
        in_drag = true;
    }
    else if (grabbed == "A") {
        delta = diff(mouse, corner(tri));
        tri.dx = norm(delta);
        tri.theta = Math.atan2(delta.y, delta.x);
        do_redraw = true;
        in_drag = true;
    }
    else if (grabbed == "B") {
        delta = diff(mouse, corner(tri));
        tri.dy = norm(delta);
        tri.theta = Math.atan2(-delta.x, delta.y);
        do_redraw = true;
        in_drag = true;
    }

    if (do_redraw) {
        redraw(ctx);
        return true;
    }
    return false;
};

c.addEventListener('mousedown', onMouseDown, false);
c.addEventListener('mouseup',   onMouseUp,   false);
c.addEventListener('mousemove', onMouseMove, false);

c.addEventListener('touchstart', onTouchBegin);
c.addEventListener('touchend',   onMouseUp   );
c.addEventListener('touchmove',  onTouchMove );

c.addEventListener('click', function(event) {
    var rect = c.getBoundingClientRect();
    var click = { "x": event.clientX - rect.left - center.x,
                  "y": event.clientY - rect.top - center.y };

    if (!in_drag) {
        if (near_line(corner(tri), vtx_a(tri))(click)) {
            reflected.a = !reflected.a;
            redraw(ctx);
        }
        else if (near_line(corner(tri), vtx_b(tri))(click)) {
            reflected.b = !reflected.b;
            redraw(ctx);
        }
        else if (near_line(vtx_a(tri), vtx_b(tri))(click)) {
            reflected.c = !reflected.c;
            redraw(ctx);
        }
    }
    in_drag = false;
}, false);

var semicircle = {
    "render": function(ctx) {
        ctx.beginPath();
        ctx.arc(500, 0, 500, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },
    "area": function() { return "π / 8"; }
};

var bitmap = {
    "render": function(ctx) {
        pix = 1000 / invader.width;
        for (i = 0; i < invader.width; i++) {
            for (j = 0; j < invader.height; j++) {
                if (invader.data[invader.height - 1 - j][i]) {
                    x0 = i * pix;
                    y0 = j * pix;
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x0 + pix, y0);
                    ctx.lineTo(x0 + pix, y0 + pix);
                    ctx.lineTo(x0, y0 + pix);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
    },
    "area": function() {
        num = 0;
        for (i = 0; i < invader.width; i++) {
            for (j = 0; j < invader.height; j++) {
                if (invader.data[j][i]) {
                    num += 1;
                }
            }
        }
        return num + " / " + (invader.width * invader.width);
    }
};

var equilateral = {
    "render": function(ctx) {
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(1000,0);
        ctx.lineTo(500, 500 * Math.sqrt(3));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },
    "area": function() { return "√3 / 4"; }
};

var similar = {
    "render": function(ctx) {
        var dx = tri.dx,
            dy = tri.dy;
        var theta = Math.atan2(dy, dx);
        r = 1000 * dx / Math.sqrt(dx*dx + dy*dy);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(1000,0);
        ctx.lineTo(r * Math.cos(theta), r * Math.sin(theta));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.moveTo((r - 100) * Math.cos(theta), (r - 100) * Math.sin(theta));
        ctx.lineTo((r - 100) * Math.cos(theta) + 100 * Math.sin(theta), (r - 100) * Math.sin(theta) - 100 * Math.cos(theta));
        ctx.lineTo(r * Math.cos(theta) + 100 * Math.sin(theta), r * Math.sin(theta) - 100 * Math.cos(theta));
        ctx.stroke();
    },
    "area": function() {
        return (tri.dx * tri.dy / (2 * (tri.dx * tri.dx + tri.dy * tri.dy))).toFixed(2);
    }
};

var square = {
    "render": function(ctx) {
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(1000,0);
        ctx.lineTo(1000,1000);
        ctx.lineTo(0,1000);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },
    "area": function() { return "1"; }
};

var pentomino = {
    "render": function(ctx) {
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(1000,0);
        ctx.lineTo(1000,500);
        ctx.lineTo(2000,500);
        ctx.lineTo(2000,1000);
        ctx.lineTo(500,1000);
        ctx.lineTo(500,500);
        ctx.lineTo(0,500);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },
    "area": function() { return "5 / 4"; }
};

var hexagon = {
    "render": function(ctx) {
        ctx.beginPath();
        ctx.moveTo(0,0);
        var cx = 500
        var cy = 500 * Math.sqrt(3);
        for (i = 0; i < 6; i++) {
            var theta = 3*Math.PI / 2 + 2 * Math.PI * i / 6 + Math.PI/ 6;
            ctx.lineTo(cx + 1000 * Math.cos(theta),
                       cy + 1000 * Math.sin(theta));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },
    "area": function() { return "3 √3 / 2"; }
};

var shape = semicircle;

function equation(ctx) {
    // Draw the division equation in the upper right
    var r = 50;
    ctx.save();
    ctx.translate(20 - center.x, 60 - center.y);
    ctx.scale(r / 1000, -r / 1000);
    ctx.fillStyle = 'rgba(80,80,80,0.5)';
    ctx.strokeStyle = 'rgba(20,20,20,0.5)';
    ctx.lineWidth = 2 * 1000 / r;
    ctx.lineJoin = 'miter';
    shape.render(ctx);
    ctx.restore();
    
    ctx.save();
    ctx.translate(150 - center.x, 60 - center.y);
    ctx.scale(r / 1000, -r / 1000);
    ctx.fillStyle = 'rgba(80,80,80,0.5)';
    ctx.strokeStyle = 'rgba(20,20,20,0.5)';
    ctx.lineWidth = 2 * 1000 / r;
    ctx.lineJoin = 'miter';
    square.render(ctx);
    ctx.restore();

    ctx.save();
    ctx.translate(250 - center.x, 60 - center.y);
    ctx.font = "30px Helvetica";
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    ctx.fillText("=  " + shape.area(), -20, -15);
    ctx.fillText("÷", -150, -10);
    ctx.restore();
};

var the_triangle = function(ctx) {
    // Draw the triangle itself...
    ctx.beginPath();
    ctx.moveTo(tri.x, tri.y);
    ctx.lineTo(tri.x + tri.dx * Math.cos(tri.theta),
               tri.y + tri.dx * Math.sin(tri.theta));
    ctx.lineTo(tri.x - tri.dy * Math.sin(tri.theta),
               tri.y + tri.dy * Math.cos(tri.theta));
    ctx.closePath();
    if (grabbed == "C") {
        ctx.fillStyle = 'rgba(0,158,115,0.25)';
        ctx.fill();
    }
    else {
        ctx.fillStyle = 'white';
    }
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.stroke();
    // ...and the little right-angle marker
    ctx.beginPath();
    ctx.moveTo(tri.x + 20 * Math.cos(tri.theta),
               tri.y + 20 * Math.sin(tri.theta));
    ctx.lineTo(tri.x + 20 * (Math.cos(tri.theta) - Math.sin(tri.theta)),
               tri.y + 20 * (Math.sin(tri.theta) + Math.cos(tri.theta)));
    ctx.lineTo(tri.x - 20 * Math.sin(tri.theta),
               tri.y + 20 * Math.cos(tri.theta));
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.stroke();

    // Draw the control points at the vertices
    ctx.beginPath();
    ctx.arc(tri.x + tri.dx * Math.cos(tri.theta),
            tri.y + tri.dx * Math.sin(tri.theta),
            5, 0, 2*Math.PI);
    ctx.LineWidth = 1;
    ctx.stroke();
    if (grabbed == "A") {
        ctx.fillStyle = 'rgba(0,158,115,1)';
        ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(tri.x - tri.dy * Math.sin(tri.theta),
            tri.y + tri.dy * Math.cos(tri.theta),
            5, 0, 2*Math.PI);
    ctx.LineWidth = 1;
    ctx.stroke();
    if (grabbed == "B") {
        ctx.fillStyle = 'rgba(0,158,115,1)';
        ctx.fill();
    }
};

var redraw = function(ctx) {
    ctx.save();
    ctx.globalAlphaValue = 1;
    ctx.clearRect(-center.x, -center.y, c.width, c.height);

    if (!qed && shape == similar && reflected.a && reflected.b && reflected.c) {
        qed = true;
        $('#proof').html("Let's try to prove it for triangles that are similar to the original right triangle.</p><p>On each side, construct a triangle similar to the original and attached along its longest side. The triangles on the short sides together cover the original triangle; so does the triangle on the long side, all by itself. This completes the proof.</p><p align=right> Q.E.D.");
        $('#qed').attr('class', 'alert alert-success');
        $('#postqed').removeClass('invisible');
    }
    
    // Draw the first leg's figure
    var r = tri.dx;
    ctx.save();
    ctx.translate(tri.x, tri.y);
    ctx.scale(r / 1000, r / 1000);
    ctx.rotate(tri.theta);
    ctx.scale(-1,-1);
    ctx.translate(-1000,0);
    if (reflected.a) {
        ctx.scale(1,-1);
    }
    ctx.fillStyle = 'rgba(240,228,66,0.5)';
    ctx.strokeStyle = 'rgba(120,114,33,1)';
    ctx.lineWidth = 2 * 1000 / r;
    ctx.lineJoin = 'miter';
    shape.render(ctx);
    ctx.restore();
    
    // Draw the second leg's figure
    var r = tri.dy;
    ctx.save();
    ctx.translate(tri.x, tri.y);
    ctx.scale(r / 1000, r / 1000);
    ctx.rotate(tri.theta + Math.PI / 2);
    if (reflected.b) {
        ctx.scale(1,-1);
    }
    ctx.fillStyle = 'rgba(213,94,0,0.5)';
    ctx.strokeStyle = 'rgba(213,94,0,1)';
    ctx.lineWidth = 2 * 1000 / r;
    ctx.lineJoin = 'miter';
    shape.render(ctx);
    ctx.restore();
    
    // Draw the hypotenuse's figure
    var theta = -Math.PI / 2 + Math.atan2(tri.dx, tri.dy);
    var r = Math.sqrt(tri.dx*tri.dx + tri.dy*tri.dy);
    ctx.save();
    ctx.translate(tri.x - tri.dy*Math.sin(tri.theta), tri.y + tri.dy * Math.cos(tri.theta));
    ctx.rotate(theta + tri.theta);
    ctx.scale(r / 1000, r / 1000);
    ctx.scale(-1,1);
    ctx.translate(-1000,0);
    if (reflected.c) {
        ctx.scale(1,-1);
    }
    ctx.fillStyle = 'rgba(86,180,233,0.5)';
    ctx.strokeStyle = 'rgba(86,180,233,1)';
    ctx.lineWidth = 2 * 1000 / r;
    ctx.lineJoin = 'miter';
    shape.render(ctx);
    ctx.restore();

    the_triangle(ctx);

    //equation(ctx);
    
    ctx.restore();
};

window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    w = $("#myCanvas").parent().width();
    c.width  = w;
    c.height = w;
    ctx = c.getContext("2d");
    center = { "x": c.width / 2,
               "y": c.height / 2 };
    ctx.translate(center.x, center.y);

    redraw(ctx);
};

$(function() {
    $("#shapeSemi").click(function(e) {
        shape = semicircle;
        redraw(ctx);
        $("#dropdownMenuButton").html("Semi-circles");
    });
    $("#shapeSquare").click(function(e) {
        shape = square;
        redraw(ctx);
        $("#dropdownMenuButton").html("Squares");
    });
    $("#shapePent").click(function(e) {
        shape = pentomino;
        redraw(ctx);
        $("#dropdownMenuButton").html("Pentomino");
    });
    $("#shapeEqui").click(function(e) {
        shape = equilateral;
        redraw(ctx);
        $("#dropdownMenuButton").html("Equilateral △");
    });
    $("#shapeSim").click(function(e) {
        shape = similar;
        redraw(ctx);
        $("#dropdownMenuButton").html("Similar △");
    });
    $("#shapeHex").click(function(e) {
        shape = hexagon;
        redraw(ctx);
        $("#dropdownMenuButton").html("Hexagons");
    });
    $("#shapeInv").click(function(e) {
        shape = bitmap;
        redraw(ctx);
        $("#dropdownMenuButton").html("Invasion!");
    });

    resizeCanvas();
});
