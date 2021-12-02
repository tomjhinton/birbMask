
const float PI = 3.1415926535897932384626433832795;
const float TAU = PI * 2.;
uniform vec2 uResolution;
uniform vec2 uMouse;

uniform float uA;
uniform float uB;
uniform float uC;
uniform float uD;

varying vec2 vUv;
varying float vTime;

const vec2 v60 = vec2( cos(PI/3.0), sin(PI/3.0));
const vec2 vm60 = vec2(cos(-PI/3.0), sin(-PI/3.0));
const mat2 rot60 = mat2(v60.x,-v60.y,v60.y,v60.x);
const mat2 rotm60 = mat2(vm60.x,-vm60.y,vm60.y,vm60.x);


//	Classic Perlin 2D Noise
//	by Stefan Gustavson
//
vec4 permute(vec4 x)
{
    return mod(((x*34.0)+1.0)*x, 289.0);
}


vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

float circle(in vec2 _st, in float _radius){
    vec2 dist = _st-vec2(0.5);
	return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(dist,dist)*4.0);
}

float box(vec2 _st, vec2 _size, float _smoothEdges){
   _size = vec2(0.5)-_size*0.5;
   vec2 aa = vec2(_smoothEdges*0.5);
   vec2 uv = smoothstep(_size,_size+aa,_st);
   uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
   return uv.x*uv.y;
}

float wiggly(float cx, float cy, float amplitude, float frequency, float spread){

  float w = sin(cx * amplitude * frequency * PI) * cos(cy * amplitude * frequency * PI) * spread;

  return w;
}



void coswarp(inout vec3 trip, float warpsScale ){

  trip.xyz += warpsScale * .1 * cos(3. * trip.zyx + (vTime * .5));
  trip.xyz += warpsScale * .05 * sin(11. * trip.zyx + (vTime * .5));
  trip.xyz += warpsScale * .025 * cos(17. * trip.zyx + (vTime * .5));
  trip.xyz += warpsScale * .0125 * sin(21. * trip.zyx + (vTime * .5));
}

float triangleGrid(vec2 p, float stepSize,float vertexSize,float lineSize)
{
    // equilateral triangle grid
    vec2 fullStep= vec2( stepSize , stepSize*v60.y);
    vec2 halfStep=fullStep/2.0;
    vec2 grid = floor(p/fullStep);
    vec2 offset = vec2( (mod(grid.y,2.0)==1.0) ? halfStep.x : 0. , 0.);
   	// tiling
    vec2 uv = mod(p+offset,fullStep)-halfStep;
    float d2=dot(uv,uv);
    return vertexSize/d2 + // vertices
    	max( abs(lineSize/(uv*rotm60).y), // lines -60deg
        	 max ( abs(lineSize/(uv*rot60).y), // lines 60deg
        	  	   abs(lineSize/(uv.y)) )); // h lines
}

float stroke(float x, float s, float w){
  float d = step(s, x+ w * .5) - step(s, x - w * .5);
  return clamp(d, 0., 1.);
}

vec2 rotateUV(vec2 uv, vec2 pivot, float rotation) {
  mat2 rotation_matrix=mat2(  vec2(sin(rotation),-cos(rotation)),
                              vec2(cos(rotation),sin(rotation))
                              );
  uv -= pivot;
  uv= uv*rotation_matrix;
  uv += pivot;
  return uv;
}

float triangleDF(vec2 uv){
  uv =(uv * 2. -1.) * 2.;
  return max(
    abs(uv.x) * 0.866025 + uv.y * 0.5 ,
     -1. * uv.y * 0.5);
}

void main(){

  float alpha = 1.;
  vec2 uv = vUv ;

  float b = circle(vec2(uv.x -.15, uv.y -.1), .055 + wiggly(uv.x + vTime * .05, uv.y + vTime * .05, 2., 6., 0.007));

  b += circle(vec2(uv.x +.15, uv.y -.1), .055 + wiggly(uv.x + vTime * .05, uv.y + vTime * .05, 2., 6., 0.007));

  vec2 rote = rotateUV(uv, vec2(.0), PI * vTime * .05);
  vec2 roteC = rotateUV(uv, vec2(.0), -PI * vTime * .05);

  float g = stroke(triangleDF(vec2(uv.x, uv.y+ .01)), .02 , .12);



  float r = box(vec2(uv.x, uv.y +.25), vec2(.5, uC), .01);

  vec3 color = vec3(1.- (r+ b + g));
  // color.b = b;
  // color.r = r;
  if( color == vec3(1.)){
    color = vec3(uv.x, uv.y, 1.);
    coswarp(color, uB);
  }

  if( color == vec3(0.)){
  r *= stroke(triangleGrid(uv, uA, 0.000005,0.001), .1, .1 * sin(vTime) +.2 );

  b *= cnoise(rote * 3. * uD * cnoise(roteC * 9. * uD));

    g *= cnoise(roteC * 13. * uD * cnoise(rote * 2. *uD));

  color = vec3(1.- (r+ b + g));
  }



 gl_FragColor =  vec4(color, alpha);

}
