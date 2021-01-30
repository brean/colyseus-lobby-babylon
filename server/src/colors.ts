// based on https://stackoverflow.com/questions/46432335/hex-to-hsl-convert-javascript
function hexToHsl(color) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);

  var r = parseInt(result[1], 16);
  var g = parseInt(result[2], 16);
  var b = parseInt(result[3], 16);

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }

  s = s*100;
  s = Math.round(s);
  l = l*100;
  l = Math.round(l);
  h = Math.round(360*h);
  return [h, s, l]
}

// use HSL to always garantee a bright color
// based on https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex
function hslToHex(hue: number, saturation: number, lightness:number) {
  hue = hue % 360;
  if (hue < 0) {
    hue += 360
  }
  lightness /= 100;
  const a = saturation * Math.min(lightness, 1 - lightness) / 100;
  const f = n => {
    const k = (n + hue / 30) % 12;
    const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function getRandomColor():string {
  const color = hslToHex(Math.random()*360, 80, 50);
  return color.toUpperCase();
}

export { hexToHsl, getRandomColor, hslToHex }