# Pythagorean theorem

<canvas id="myCanvas" width="800" height="600" style="border:1px solid #000000;"></canvas>

<script>
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
ctx.beginPath();
ctx.moveTo(300,200);
ctx.lineTo(400,200);
ctx.lineTo(400,400);
ctx.closePath();
ctx.fillStyle = 'white';
ctx.strokeStyle = '#202020';
ctx.fill();
ctx.stroke();
</script>