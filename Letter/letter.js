const canvas = document.getElementById("letters");
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "black";
ctx.lineWidth = 2;
ctx.lineCap = "round";
let font = null;
opentype.load(
  "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf",
  function (err, font1) {
    if (err) {
      console.error(err);
      return;
    }
    console.log(font1);
    font = font1;
    drawText("Arnob", font, 100, 200, 140);
    console.log("done drawing");
  }
);

function drawText(text, font, x, y, size) {
  const path = font.getPath(text, x, y, size);
  const commands = path.commands;

  ctx.beginPath();
  console.log(commands);
  commands.forEach(cmd => {
    switch (cmd.type) {
      case "M":
        ctx.moveTo(cmd.x, cmd.y);
        break;
      case "L":
        ctx.lineTo(cmd.x, cmd.y);
        break;
      case "C":
        ctx.bezierCurveTo(
          cmd.x1, cmd.y1,
          cmd.x2, cmd.y2,
          cmd.x, cmd.y
        );
        break;
      case "Q":
        ctx.quadraticCurveTo(
          cmd.x1, cmd.y1,
          cmd.x, cmd.y
        );
        break;
      case "Z":
        ctx.closePath();
        break;
    }
  });

  ctx.stroke();
}

// top left x: 89.921875
// bottom left x: 51.9140625
// height: 200-100.46875
// width: 139.482421875-126.015625 

function drawParallellogram(x, y, width, height, angle) {
  const radians = angle;
  const offsetX = height * Math.tan(radians);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width + offsetX, y + height);
  ctx.lineTo(x + offsetX, y + height);
  ctx.closePath();
  ctx.stroke();
}

drawParallellogram(100, 300, 151.40625-139.921875, 200-100.46875, Math.atan2(101.9140625-139.921875, 200-100.46875));
drawParallellogram(100, 300, 151.40625-139.921875, 200-100.46875, Math.atan2(-101.9140625+139.921875, 200-100.46875));
drawParallellogram(85, 363, 166.513671875-124.814453125, 11, 0);

//drawParallellogram(160, 325, 13, 200-100.46875-25, 0);

function drawTriangle(p1, p2, p3) {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.stroke();
}

function drawDaleCarlian(x1,y1, width, height){
  drawParallellogram(x1, y1, width, height, 0);
  drawTriangle({x: x1+width, y: y1+height/10}, {x: x1+width*1.5, y: y1}, {x: x1+width*3, y: y1});
  drawTriangle({x: x1+width, y: y1+2.5*height/10}, {x: x1+width*1.5, y: y1+1.5*height/10}, {x: x1+width*3, y: y1+1.5*height/10});
}

function createCongruentTriangle(A, B, C, bisectorLength) {
    // Utility vector functions
    const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
    const add = (p, q) => ({ x: p.x + q.x, y: p.y + q.y });
    const mul = (p, s) => ({ x: p.x * s, y: p.y * s });
    const dot = (p, q) => p.x * q.x + p.y * q.y;
    const length = (p) => Math.sqrt(p.x * p.x + p.y * p.y);
    const normalize = (p) => {
        const len = length(p);
        return { x: p.x / len, y: p.y / len };
    };

    // Side lengths
    const AB = length(sub(A, B));
    const BC = length(sub(C, B));
    const CA = length(sub(A, C));

    // Law of Cosines angles
    const angleA = Math.acos((AB*AB + CA*CA - BC*BC) / (2 * AB * CA));
    const angleB = Math.acos((AB*AB + BC*BC - CA*CA) / (2 * AB * BC));
    const angleC = Math.acos((BC*BC + CA*CA - AB*AB) / (2 * BC * CA));

    // Determine largest angle
    let largest = angleA;
    let vertex = 'A';
    let P = A, Q = B, R = C;

    if (angleB > largest) {
        largest = angleB;
        vertex = 'B';
        P = B; Q = A; R = C;
    }

    if (angleC > largest) {
        vertex = 'C';
        P = C; Q = A; R = B;
    }

    // Compute angle bisector direction
    const v1 = normalize(sub(Q, P));
    const v2 = normalize(sub(R, P));

    const bisectorDir = normalize(add(v1, v2));

    // Compute new vertex P1
    const P1 = add(P, mul(bisectorDir, bisectorLength));

    // Translation vector
    const t = sub(P1, P);

    // Translate entire triangle
    const A1 = add(A, t);
    const B1 = add(B, t);
    const C1 = add(C, t);

    return [A1, B1, C1];
}
//drawTriangle({x: 160+13, y: 334}, {x: 160+13+6, y: 325}, {x: 160+36, y: 325});
drawDaleCarlian(160, 325, 13, 200-100.46875-25);
drawDaleCarlian(210, 325, 13, 200-100.46875-25);

drawTriangle({x: 210+13*3, y: 325}, {x: 210+13*5, y: 325}, {x: 210+13*5, y: 325+3*(200-100.46875-25)/10});
drawTriangle({x: 210+13*3, y: 325+1.5*(200-100.46875-25)/10}, {x: 210+13*4, y: 325+1.5*(200-100.46875-25)/10}, {x: 210+13*4, y: 325+3*(200-100.46875-25)/10});