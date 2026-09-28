/* ── mycelium · glass ──
 *
 * The page's companion: five droplets of iridescent glass (the agents) joined
 * by thin hyphae, drawn live. It follows the reader down the whole page, and
 * every part of it stands for something in the product:
 *
 *   droplets   the agents in a room          (labelled @scout, @sec, …)
 *   hyphae     the room's channel between peers — a ring, no hub
 *   pulses     messages moving along it
 *   halo       the aligner, closing in during a negotiation
 *   veins      room memory, growing inside the glass as they converge
 *   bead       you: it condenses under the cursor near the network and joins it
 *
 * site.js drives the scene from scroll with one state object:
 *   merge  0 → 1   scattered peers → one drop (the outcome)
 *   dusk   0 → 1   the plates' cobalt field → the page's night
 *   alpha, x, y, scale, veins, halo, vel
 * and this file eases toward it every frame, so scroll never jerks it.
 *
 * Rendering is a raymarched signed-distance field. Droplets are spheres
 * blended with a smooth-min whose softness grows with merge, so they pool
 * rather than overlap. Glass is screen-space refraction with per-channel
 * dispersion, a thin-film interference term pooled across the surface (the
 * sweeps of spectrum in the Midjourney plates), a backlit caustic and two
 * softbox highlights. The field is sampled from the plates themselves.
 */
(function () {
  var canvas = document.getElementById('glass');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { document.documentElement.classList.add('no-webgl'); return; }

  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;',
    'uniform float uTime,uMerge,uDusk,uLink,uS,uWob,uVein,uBound;',
    'uniform vec3 uCam,uC;',
    'uniform vec4 uB[5];',
    'uniform vec4 uBead;',   // xyz, radius (0 = absent)
    'uniform vec4 uTeth;',   // the agent the bead is tethered to; w = tether radius
    'uniform vec4 uHalo;',   // major radius, minor radius (0 = absent), tilt, spin
    'uniform vec4 uP[8];',   // message pulses: xyz, brightness
    'uniform sampler2D uMyc;', // the mycelial network: a trail map from the sim below
    'uniform vec2 uMT;',       // one texel of it, in uv
    'uniform vec3 uMC;',       // the cluster's centre in uv, and its size in screen heights
    'uniform float uMycOn;',

    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    'float cap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}',
    'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'vec2 hash2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}',
    'float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);',
    '  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),',
    '             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}',

    // Cobalt field, sampled from the plates (#134cd1 top, #2c7ad8 mid, #48a6dc low),
    // crossfading to the page's night (#0b0d12).
    'vec3 field(vec2 uv){',
    '  vec3 top=vec3(.075,.30,.82),mid=vec3(.17,.48,.85),low=vec3(.33,.66,.87);',
    '  vec3 c=mix(low,mid,smoothstep(0.,.45,uv.y));',
    '  c=mix(c,top,smoothstep(.45,1.,uv.y));',
    '  c*=1.-.16*length(uv-vec2(.62,.58));',
    '  return mix(c,vec3(.043,.051,.071),uDusk);',
    '}',

    // Spores: two parallax layers of motes drifting upward. The near layer is
    // big and out of focus, the far one small and sharp.
    'vec3 spores(vec2 q){',
    '  vec3 acc=vec3(0.);',
    '  for(int L=0;L<2;L++){',
    '    float fl=float(L);',
    '    float dens=mix(4.5,13.,fl);',
    '    vec2 p=q*dens+vec2(0.,uTime*mix(.06,.03,fl)*dens)-uCam.xy*mix(.22,.08,fl)*dens;',
    '    vec2 cell=floor(p),f=fract(p)-.5,h=hash2(cell+fl*17.3);',
    '    if(h.x>.74){',
    '      vec2 o=(hash2(cell+3.1)-.5)*.5;',
    '      float r=mix(.06,.17,h.y)*mix(1.,.55,fl);',
    '      float a=1.-smoothstep(r*mix(.15,.55,fl),r,length(f-o));',
    '      a*=.65+.35*sin(uTime*1.3+h.y*40.);',
    '      acc+=a*mix(.07,.2,fl)*mix(vec3(1.),vec3(.45,.9,1.),uDusk);',
    '    }',
    '  }',
    '  return acc;',
    '}',

    'float map(vec3 p){',
    '  float k=mix(.14,.62,uMerge)*uS;',
    '  float d=length(p-uB[0].xyz)-uB[0].w;',
    '  d=smin(d,length(p-uB[1].xyz)-uB[1].w,k);',
    '  d=smin(d,length(p-uB[2].xyz)-uB[2].w,k);',
    '  d=smin(d,length(p-uB[3].xyz)-uB[3].w,k);',
    '  d=smin(d,length(p-uB[4].xyz)-uB[4].w,k);',
    // hyphae: a peer ring plus two chords. No hub, on purpose.
    '  float l=cap(p,uB[0].xyz,uB[1].xyz,uLink);',
    '  l=min(l,cap(p,uB[1].xyz,uB[2].xyz,uLink));',
    '  l=min(l,cap(p,uB[2].xyz,uB[3].xyz,uLink));',
    '  l=min(l,cap(p,uB[3].xyz,uB[4].xyz,uLink));',
    '  l=min(l,cap(p,uB[4].xyz,uB[0].xyz,uLink));',
    '  l=min(l,cap(p,uB[0].xyz,uB[2].xyz,uLink*.7));',
    '  l=min(l,cap(p,uB[1].xyz,uB[3].xyz,uLink*.7));',
    '  d=smin(d,l,.16*uS);',
    // you, and the thread you hold to the nearest agent
    '  if(uBead.w>.004){',
    '    float b=min(length(p-uBead.xyz)-uBead.w,cap(p,uBead.xyz,uTeth.xyz,uTeth.w));',
    '    d=smin(d,b,.22*uS);',
    '  }',
    // the aligner's halo
    '  if(uHalo.y>.002){',
    '    vec3 q=p-uC; q.yz=rot(uHalo.z)*q.yz; q.xz=rot(uHalo.w)*q.xz;',
    '    d=smin(d,length(vec2(length(q.xz)-uHalo.x,q.y))-uHalo.y,.1*uS);',
    '  }',
    // a slow liquid wobble, livelier while the page is moving
    '  vec3 w=(p-uC)/uS;',
    '  d+=uWob*uS*sin(w.x*3.7+uTime*.9)*sin(w.y*4.1-uTime*.7)*sin(w.z*3.3+uTime*.5);',
    '  return d;',
    '}',

    'vec3 nrm(vec3 p){vec2 e=vec2(.0015,-.0015);return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}',

    // Thin-film interference, approximated: phase grows with film thickness
    // and path length, so colour sweeps red → yellow → cyan → violet.
    'vec3 film(float t){return .5+.5*cos(6.28318*(t+vec3(0.,.33,.67)));}',

    // Memory: branching ridges of 3D noise, read through the glass.
    'float ridge(vec3 q){return 1.-abs(2.*n3(q)-1.);}',
    'float veins(vec3 q){float r=ridge(q)*.7+ridge(q*2.3+vec3(4.1,1.7,2.9))*.3;return pow(r,18.);}',

    // The network, drawn as fine glassy threads on the field: a tube-like
    // normal from the trail's gradient gives each strand a lit core and a
    // thin-film sheen at its edges. Frosted white by day, glowing cyan at
    // night, fading out with distance from the agents it grows between.
    'float myc(vec2 uv){return texture2D(uMyc,vec2(uv.x,1.-uv.y)).r;}',
    'vec3 hyphae(vec2 uv){',
    '  if(uMycOn<.01) return vec3(0.);',
    '  vec2 dq=(uv-uMC.xy)*vec2(uRes.x/uRes.y,1.);',
    '  float d=length(dq)/max(uMC.z,.05);',
    '  float root=exp(-d*d*.22);',          // rooted: fades out away from the agents
    '  if(root<.01) return vec3(0.);',
    '  float m=myc(uv);',
    '  if(m<.06) return vec3(0.);',     // below this is fade residue
    '  vec2 o=uMT;',
    '  float gx=myc(uv+vec2(o.x,0.))-myc(uv-vec2(o.x,0.));',
    '  float gy=myc(uv+vec2(0.,o.y))-myc(uv-vec2(0.,o.y));',
    // A tube's normal from the stroke's cross-section: lit along its core,
    // with thin-film colour where it turns away at the edges.
    '  vec3 n=normalize(vec3(-gx*1.4,-gy*1.4,.35));',
    '  float line=smoothstep(.06,.95,m);',   // soft edges: part of the ground, not drawn on it
    '  float sheen=pow(1.-n.z,1.2);',
    '  vec3 fl=film(.4+sheen*1.4+m*.5);',
    // Tinted toward the field's own light, with just a trace of sheen, so the
    // web reads as part of the background rather than laid over it.
    '  vec3 day=vec3(.5,.75,1.)*line*.2+fl*sheen*line*.1;',
    '  vec3 night=vec3(.16,.52,.7)*line*.42+fl*sheen*line*.06;',
    '  return mix(day,night,uDusk)*uMycOn*root;',
    '}',
    // Everything behind the glass: the field and the network on it. The glass
    // refracts this, so the droplets bend and magnify the threads behind them.
    'vec3 backdrop(vec2 uv){return field(uv)+hyphae(uv);}',

    'void bnd(vec3 ro,vec3 rd,vec3 c,float r,inout float t0,inout float t1){',
    '  vec3 oc=c-ro;float b=dot(oc,rd);float h=b*b-dot(oc,oc)+r*r;',
    '  if(h>0.){h=sqrt(h);t0=min(t0,b-h);t1=max(t1,b+h);}',
    '}',

    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/uRes;',
    '  vec2 q=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    '  vec3 ro=uCam;',
    '  vec3 ta=vec3(uCam.x*.35,uCam.y*.35,0.);',
    '  vec3 ww=normalize(ta-ro),uu=normalize(cross(ww,vec3(0.,1.,0.))),vv=cross(uu,ww);',
    '  vec3 rd=normalize(q.x*uu+q.y*vv+1.6*ww);',
    '  vec3 col=backdrop(uv)+spores(q);',

    // Night-side glow around the cluster, so the glass has light to live in.
    '  vec3 oc=uC-ro; float perp=length(cross(rd,oc))/uS;',
    '  col+=uDusk*vec3(.05,.2,.42)*exp(-perp*perp*.55)*.9;',

    '  float t0=1e9,t1=-1.;',
    '  bnd(ro,rd,uC,uBound,t0,t1);',
    '  if(uBead.w>.004) bnd(ro,rd,uBead.xyz,uBead.w+.5*uS,t0,t1);',
    '  if(t1>0.){',
    '    float t=max(t0,0.),d,md=1e3,mt=t; bool hit=false;',
    '    for(int i=0;i<96;i++){',
    '      vec3 p=ro+rd*t; d=map(p);',
    '      if(d<md){md=d;mt=t;}',
    '      if(d<.001){hit=true;mt=t;break;}',
    '      t+=d*.9; if(t>t1)break;',
    '    }',
    // Coverage from the ray's closest approach: an anti-aliased silhouette.
    '    float pw=mt/(1.6*uRes.y);',
    '    float cov=hit?1.:clamp(1.-md/(pw*1.6),0.,1.);',
    '    if(cov>0.){',
    '      vec3 p=ro+rd*mt,n=nrm(p),v=-rd;',
    '      float ct=clamp(dot(n,v),0.,1.);',
    '      float fr=.04+.96*pow(1.-ct,5.);',
    '      vec3 rf=refract(rd,n,1./1.45);',
    '      vec2 off=(rf.xy-rd.xy)*.34+n.xy*.05;',
    '      vec3 refr=vec3(backdrop(uv+off*1.00).r,backdrop(uv+off*1.07).g,backdrop(uv+off*1.15).b);',
    '      vec3 deep=mix(vec3(.09,.36,.93),vec3(.04,.16,.42),uDusk);',
    '      vec3 body=mix(refr*vec3(.8,.96,1.15),deep,.38*ct);',
    '      float back=pow(clamp(dot(n,normalize(vec3(.35,-.6,.55))),0.,1.),2.2);',
    '      body+=vec3(.32,.78,1.)*back*mix(.55,.8,uDusk);',
    '      vec3 wp=(p-uC)/uS;',
    '      float pool=smoothstep(.25,.95,.5+.5*sin(dot(n,vec3(2.2,-1.4,.9))*1.5+dot(wp,vec3(.7,1.,-.5))*1.2+uTime*.2));',
    '      float th=.35+.45*pool+.8*(1.-ct);',
    '      vec3 irid=film(th); irid=mix(irid,irid*vec3(1.2,.95,.8),.5);',
    '      float w=clamp(pool*.5+pow(1.-ct,2.2)*.55,0.,1.)*.85;',
    '      vec3 g=mix(body,irid*1.12,w);',
    // Veins, sampled a short way into the glass along the refracted ray.
    '      if(uVein>.01){',
    '        float vs=0.;',
    '        for(int i=0;i<5;i++){',
    '          vec3 s=(p+rf*(.05+.08*float(i))*uS-uC)/uS;',
    '          vs+=veins(s*2.4+vec3(0.,uTime*.04,uTime*.02));',
    '        }',
    '        vs=clamp(vs*.42,0.,1.)*uVein*ct;',
    '        g=mix(g,g*vec3(.3,.42,.9),vs*.6*(1.-uDusk));',
    '        g+=vs*mix(vec3(.5,.8,1.)*.25,vec3(.3,.95,1.)*1.25,uDusk);',
    '      }',
    '      vec3 r=reflect(rd,n);',
    '      float s1=pow(max(dot(r,normalize(vec3(-.45,.75,.55))),0.),80.);',
    '      float s2=pow(max(dot(r,normalize(vec3(.75,.35,.55))),0.),16.);',
    '      g+=vec3(1.)*s1*2.4+vec3(1.,.95,.9)*s2*.35;',
    '      g+=fr*.3+pow(1.-ct,7.)*.35;',
    '      col=mix(col,g,cov);',
    '    }',
    '  }',
    // Messages in flight: a hot core and a soft halo per pulse.
    '  for(int i=0;i<8;i++){',
    '    vec3 o=uP[i].xyz-ro; float al=dot(o,rd); float pd=length(o-rd*al)/uS;',
    '    col+=uP[i].w*(vec3(.85,.97,1.)*exp(-pd*pd*1600.)*1.5+vec3(.35,.8,1.)*exp(-pd*pd*110.)*.25);',
    '  }',
    '  col+=(hash(gl_FragCoord.xy+fract(uTime)*91.)-.5)*.028;',
    '  gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('glass shader:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { document.documentElement.classList.add('no-webgl'); return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { document.documentElement.classList.add('no-webgl'); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ['uRes', 'uTime', 'uMerge', 'uDusk', 'uLink', 'uS', 'uWob', 'uVein', 'uBound', 'uCam', 'uC',
    'uB', 'uBead', 'uTeth', 'uHalo', 'uP', 'uMyc', 'uMT', 'uMC', 'uMycOn'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  // ── the mycelial network ──
  // Hyphae, grown by tip extension (the old splash's growth model), shaped
  // as a web rather than a halo:
  //   trunks    long, nearly straight threads that travel from one droplet
  //             to another (a few wander off to explore)
  //   branches  leave the trunks at wide angles, short and sparse
  //   fusion    a branch that meets another hypha joins it and stops
  //             (anastomosis), which closes the web into loops
  // Growth is drawn as anti-aliased strokes into an offscreen canvas that
  // slowly fades, so the web turns over and regrows wherever the agents
  // move. That canvas is the texture the shader draws as glassy threads,
  // and the glass refracts it.
  var myc = (function () {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var cv = document.createElement('canvas');
    var g = cv.getContext('2d');
    var w = 0, h = 0, px = 1, tips = [], n = 0, ids = 0;
    var MAX_TRUNKS = 9, MAX_TIPS = 90;
    // Who drew where, recently: a coarse grid of hypha ids and frame stamps,
    // so a branch can tell when it has reached somebody else's thread.
    var CELL = 5, gcw = 0, gch = 0, occ, occT;
    var WIDTH = [1.4, 0.95, 0.65], ALPHA = [0.95, 0.75, 0.55];

    // w, h: canvas size; px: canvas pixels per CSS pixel.
    function init(cw, ch, scale) {
      w = cv.width = cw; h = cv.height = ch; px = scale;
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      g.lineCap = 'round';
      tips = [];
      gcw = Math.ceil(w / CELL); gch = Math.ceil(h / CELL);
      occ = new Int32Array(gcw * gch); occT = new Int32Array(gcw * gch);
    }
    function trunks() { var c = 0; for (var i = 0; i < tips.length; i++) if (!tips[i].gen) c++; return c; }
    function sprout(drops) {
      var i = (Math.random() * drops.length) | 0, d = drops[i], to = -1, a, max;
      if (drops.length > 1 && Math.random() < 0.85) {
        // A bridge: aimed at another agent, arcing a little on the way.
        to = (i + 1 + ((Math.random() * (drops.length - 1)) | 0)) % drops.length;
        var dx = drops[to].x - d.x, dy = drops[to].y - d.y;
        a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.9;
        max = Math.hypot(dx, dy) * 1.8;
      } else {
        // An explorer: out and away from the cluster.
        var cx = 0, cy = 0;
        for (var k = 0; k < drops.length; k++) { cx += drops[k].x; cy += drops[k].y; }
        cx /= drops.length; cy /= drops.length;
        a = Math.atan2(d.y - cy, d.x - cx) + (Math.random() - 0.5) * 1.2;
        max = (140 + Math.random() * 220) * px;
      }
      tips.push({
        id: ++ids, parent: 0, x: d.x + Math.cos(a) * d.r, y: d.y + Math.sin(a) * d.r, a: a, to: to,
        gen: 0, age: 0, max: max, sp: 1.4 * px, bend: (Math.random() - 0.5) * 0.006,
      });
    }
    function step(drops) {
      n++;
      // Slow turnover. The fade is batched: at 8-bit precision a tiny
      // per-frame fade stalls, so fade a little harder every eighth frame.
      if (n % 8 === 0) { g.fillStyle = 'rgba(0,0,0,0.035)'; g.fillRect(0, 0, w, h); }
      if (drops.length && trunks() < MAX_TRUNKS && Math.random() < 0.1) sprout(drops);

      for (var i = tips.length - 1; i >= 0; i--) {
        var t = tips[i];
        t.age += t.sp;
        // Nearly straight: a faint personal bend and very little wander.
        t.a += t.bend + (Math.random() - 0.5) * 0.05;
        var goal = t.to >= 0 ? drops[t.to] : null;
        if (goal) {
          var want = Math.atan2(goal.y - t.y, goal.x - t.x);
          t.a += Math.atan2(Math.sin(want - t.a), Math.cos(want - t.a)) * 0.03;
        }
        var nx = t.x + Math.cos(t.a) * t.sp, ny = t.y + Math.sin(t.a) * t.sp;
        var done = nx < 0 || ny < 0 || nx >= w || ny >= h || t.age > t.max ||
          (goal && Math.hypot(goal.x - nx, goal.y - ny) < goal.r);
        // Fusion: a branch meeting another live thread joins it and stops.
        var c = done ? -1 : ((ny / CELL) | 0) * gcw + ((nx / CELL) | 0);
        if (c >= 0 && t.gen && t.age > 12 * px && occ[c] && occ[c] !== t.id && occ[c] !== t.parent && n - occT[c] < 900) done = true;
        g.lineWidth = WIDTH[t.gen] * px;
        g.strokeStyle = 'rgba(255,255,255,' + ALPHA[t.gen] + ')';
        g.beginPath(); g.moveTo(t.x, t.y); g.lineTo(nx, ny); g.stroke();
        if (done) { tips.splice(i, 1); continue; }
        occ[c] = t.id; occT[c] = n;
        t.x = nx; t.y = ny;
        // Branches leave at wide angles; trunks branch most, twigs rarely.
        var bp = t.gen === 0 ? 0.02 : 0.008;
        if (t.gen < 2 && t.age > 20 * px && tips.length < MAX_TIPS && Math.random() < bp) {
          var side = Math.random() < 0.5 ? -1 : 1;
          tips.push({
            id: ++ids, parent: t.id, x: t.x, y: t.y, a: t.a + side * (0.9 + Math.random() * 0.6),
            to: -1, gen: t.gen + 1, age: 0, max: (40 + Math.random() * 150) * px, sp: 1.2 * px,
            bend: (Math.random() - 0.5) * 0.01,
          });
        }
      }
      // Growth is slow; every other frame is plenty to upload.
      if (n % 2 === 0 || n < 3) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cv);
      }
    }
    return { init: init, step: step, tex: tex, size: function () { return [w, h]; } };
  })();

  // ── state the page drives, and what's on screen easing toward it ──
  var KEYS = ['merge', 'dusk', 'alpha', 'x', 'y', 'scale', 'veins', 'halo'];
  var state = { merge: 0, dusk: 0, alpha: 1, x: 0.77, y: 0.45, scale: 1, veins: 0.2, halo: 0, vel: 0 };
  var shown = {};
  KEYS.forEach(function (k) { shown[k] = state[k]; });
  var wob = 0.018, ping = 0;

  var NAMES = ['@scout', '@sec', '@api', '@web', '@qa'];
  var AGENTS = [
    { R: 1.25, tilt: 0.55, r: 0.40, sp: 0.11, ph: 0.0 },
    { R: 1.05, tilt: -0.4, r: 0.30, sp: 0.09, ph: 1.3 },
    { R: 1.35, tilt: 0.35, r: 0.36, sp: 0.08, ph: 2.1 },
    { R: 1.00, tilt: -0.6, r: 0.27, sp: 0.12, ph: 0.7 },
    { R: 1.20, tilt: 0.2, r: 0.33, sp: 0.10, ph: 2.9 },
  ];
  var LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [1, 3]];
  var PULSES = [];
  for (var pi = 0; pi < 8; pi++) {
    PULSES.push({ link: LINKS[pi % 7], sp: 0.22 + ((pi * 37) % 11) / 40, ph: (pi * 0.37) % 1, rev: pi % 2 === 1 });
  }
  var balls = new Float32Array(20), pulses = new Float32Array(32);
  var pos = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

  // ── labels: HTML tags that track the droplets, behind the page's content ──
  var labelRoot = document.getElementById('glass-labels');
  var labels = [];
  if (labelRoot) {
    NAMES.concat(['@you', 'aligner']).forEach(function (n, i) {
      var el = document.createElement('span');
      el.textContent = n;
      if (i === 5) el.className = 'is-you';
      if (i === 6) el.className = 'is-aligner';
      labelRoot.appendChild(el);
      labels.push(el);
    });
  }

  // ── pointer: a parallax nudge, and your bead ──
  var fine = window.matchMedia('(pointer: fine)').matches;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -1, py: -1, last: -1e9 };
  window.addEventListener('pointermove', function (e) {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    mouse.px = e.clientX; mouse.py = e.clientY; mouse.last = performance.now();
  }, { passive: true });
  // A click (or tap) on empty page sends a ripple through the network.
  window.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('a,button,code,pre,input,.window,.card,.install')) return;
    ping = 1;
  }, { passive: true });
  var bead = { x: 0, y: 0, vx: 0, vy: 0, r: 0 };

  var W = 1, H = 1, aspect = 1, narrow = false, base = 1;
  var scale = 1, dpr = 1;
  function resize() {
    W = window.innerWidth; H = window.innerHeight; aspect = W / H;
    narrow = aspect <= 1.05;
    // Phones get a lower resolution ceiling: the glass stays sharp, the fill rate doesn't melt.
    dpr = Math.min(window.devicePixelRatio || 1, narrow || !fine ? 1.5 : 1.75);
    canvas.width = Math.max(1, Math.round(W * dpr * scale));
    canvas.height = Math.max(1, Math.round(H * dpr * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    base = narrow ? Math.min(0.5, Math.max(0.4, aspect * 0.9)) : (aspect < 1.4 ? 0.56 : 0.66);
    // Growth canvas, below CSS resolution: the strokes are soft anyway, and
    // it's re-uploaded as a texture, so its size is the cost that matters.
    var mscale = narrow || !fine ? 0.6 : 0.75;
    var mw = Math.round(W * mscale), mh = Math.round(H * mscale);
    var sz = myc.size();
    // A phone's URL bar resizing the viewport shouldn't wipe the growth.
    if (sz[0] !== mw || Math.abs(sz[1] - mh) > mh * 0.15) myc.init(mw, mh, mscale);
  }
  window.addEventListener('resize', resize);
  if (narrow || !fine) scale = 0.85;
  resize();

  function ease(t) { t = Math.min(Math.max(t, 0), 1); return t * t * (3 - 2 * t); }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { var l = Math.sqrt(dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start = performance.now(), last = start, slow = 0, fast = 0, mycGrown = false;

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    var k = 1 - Math.pow(0.002, dt);
    KEYS.forEach(function (key) { shown[key] += (state[key] - shown[key]) * k; });
    // Opacity follows a touch faster, so the scene never lingers over content.
    shown.alpha += (state.alpha - shown.alpha) * Math.min(1, k * 1.5);
    canvas.style.opacity = shown.alpha;
    if (labelRoot) labelRoot.style.opacity = shown.alpha;
    if (shown.alpha <= 0.004 || document.hidden) return;

    // Adapt resolution: drop it if we keep missing ~45fps, recover when idle.
    if (dt > 0.024) { slow++; fast = 0; } else { fast++; slow = 0; }
    if (slow > 20 && scale > 0.5) { scale = Math.max(0.5, scale - 0.15); slow = 0; resize(); }
    if (fast > 240 && scale < 1) { scale = Math.min(1, scale + 0.1); fast = 0; resize(); }

    var t = reduced ? 8 : (now - start) / 1000;
    var intro = reduced ? 1 : (now - start) / 1000;
    mouse.x += (mouse.tx - mouse.x) * k * 0.6;
    mouse.y += (mouse.ty - mouse.y) * k * 0.6;
    ping *= Math.exp(-dt * 2.5);
    var wobT = 0.018 + Math.min(Math.abs(state.vel) / 4000, 1) * 0.045 + ping * 0.06;
    wob += (wobT - wob) * Math.min(1, dt * 6);

    var S = base * shown.scale, m = shown.merge;
    // Anchor: a screen fraction projected onto the z=0 plane (camera at rest).
    var cx = (shown.x - 0.5) * aspect * 3.75, cy = (0.5 - shown.y) * 3.75;

    // Camera, with a little parallax from the pointer.
    var ro = [mouse.x * 0.55, -mouse.y * 0.35, 6];
    var ww = norm(sub([ro[0] * 0.35, ro[1] * 0.35, 0], ro));
    var uu = norm(cross(ww, [0, 1, 0])), vv = cross(uu, ww);
    function project(P) {
      var d = sub(P, ro), z = dot(d, ww);
      return { x: W / 2 + dot(d, uu) / z * 1.6 * H, y: H / 2 - dot(d, vv) / z * 1.6 * H, s: 1.6 * H / z };
    }

    // Your bead: where the pointer meets the scene's plane, on a spring.
    var beadOn = fine && !reduced && now - mouse.last < 2600 && mouse.px >= 0;
    var bx = (mouse.px / W - 0.5) * aspect * 3.75, by = (0.5 - mouse.py / H) * 3.75;
    if (beadOn) {
      bead.vx += ((bx - bead.x) * 90 - bead.vx * 14) * dt;
      bead.vy += ((by - bead.y) * 90 - bead.vy * 14) * dt;
      bead.x += bead.vx * dt; bead.y += bead.vy * dt;
    }
    var bd = Math.hypot(bead.x - cx, bead.y - cy) / S;
    var near = beadOn ? ease((2.9 - bd) / 1.1) : 0;
    bead.r += (0.15 * S * near - bead.r) * Math.min(1, dt * 5);

    var spin = t * 0.07;
    var nearest = 0, nd = 1e9;
    for (var i = 0; i < 5; i++) {
      var A = AGENTS[i];
      var ang = i * 1.3 + t * A.sp;
      // A loose ring of peers, slowly turning, each bobbing on its own orbit.
      var ra = i * 1.2566 + spin + 0.3;
      var rr = A.R + Math.sin(ang * 1.3 + A.ph) * 0.12;
      var sx = Math.cos(ra) * rr + Math.cos(ang * 1.7) * 0.08;
      var sy = Math.sin(ra) * rr * 0.86 + Math.sin(ang * 1.1 + A.ph) * 0.1;
      var sz = Math.sin(ra + A.tilt) * 0.5;
      // Staggered: the first agents give ground before the last.
      var e = ease(m * 1.35 - i * 0.07);
      var mx = Math.cos(ang * 2.0) * 0.1, my = Math.sin(ang * 2.0) * 0.1;
      var px = cx + (sx + (mx - sx) * e) * S;
      var py = cy + (sy + (my - sy) * e) * S;
      var pz = (sz - sz * e) * S;
      // Peers lean toward you when you come close.
      if (bead.r > 0.002) {
        var dx = bead.x - px, dy = bead.y - py, dd = dx * dx + dy * dy;
        var pull = 0.14 * Math.exp(-dd / (S * S * 1.2)) * near * (1 - m);
        px += dx * pull; py += dy * pull;
        if (dd < nd) { nd = dd; nearest = i; }
      }
      // Agents condense one by one on load.
      var grow = ease((intro - 0.15 - i * 0.12) / 0.9);
      pos[i][0] = px; pos[i][1] = py; pos[i][2] = pz;
      balls[i * 4] = px; balls[i * 4 + 1] = py; balls[i * 4 + 2] = pz;
      balls[i * 4 + 3] = (A.r + (0.6 - A.r) * e) * S * grow;
    }
    var linkGrow = ease((intro - 0.9) / 0.8);
    // Hyphae pulse faintly while the peers are apart, then thicken as they draw in.
    var link = (0.014 + 0.004 * Math.sin(t * 1.7) + 0.05 * ease(m * 1.2)) * S * linkGrow;

    // Messages: pulses riding the hyphae, brighter after a click.
    for (var j = 0; j < 8; j++) {
      var P = PULSES[j];
      var f = (t * P.sp * (1 + ping * 2) + P.ph) % 1;
      if (P.rev) f = 1 - f;
      var a = pos[P.link[0]], b = pos[P.link[1]];
      pulses[j * 4] = a[0] + (b[0] - a[0]) * f;
      pulses[j * 4 + 1] = a[1] + (b[1] - a[1]) * f;
      pulses[j * 4 + 2] = a[2] + (b[2] - a[2]) * f;
      pulses[j * 4 + 3] = Math.pow(Math.sin(Math.PI * f), 1.5) * (0.55 + 0.45 * (1 - m) + ping) * linkGrow;
    }

    // The aligner: a halo that closes in, then pools into the drop.
    var h = shown.halo;
    var haloR = (1.75 - 0.9 * ease((m - 0.1) / 0.7)) * S;
    var haloTilt = 1.15 + 0.15 * Math.sin(t * 0.4);

    // Feed the network: the droplets, in sim-grid cells.
    var gsz = myc.size(), drops = [];
    for (var dn = 0; dn < 5; dn++) {
      var ps = project(pos[dn]), rpx = balls[dn * 4 + 3] * ps.s;
      if (rpx < 1) continue;
      drops.push({ x: ps.x / W * gsz[0], y: ps.y / H * gsz[1], r: Math.max(1.5, rpx / W * gsz[0]) });
    }
    if (!reduced) myc.step(drops);
    else if (!mycGrown && drops.length) { for (var g0 = 0; g0 < 260; g0++) myc.step(drops); mycGrown = true; }
    var cs = project([cx, cy, 0]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, myc.tex);
    gl.uniform1i(U.uMyc, 0);
    gl.uniform2f(U.uMT, 1 / gsz[0], 1 / gsz[1]);
    gl.uniform3f(U.uMC, cs.x / W, 1 - cs.y / H, S * cs.s / H);
    gl.uniform1f(U.uMycOn, reduced ? 1 : ease((intro - 0.4) / 1.2));

    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uMerge, m);
    gl.uniform1f(U.uDusk, shown.dusk);
    gl.uniform1f(U.uLink, link);
    gl.uniform1f(U.uS, S);
    gl.uniform1f(U.uWob, wob);
    gl.uniform1f(U.uVein, shown.veins);
    gl.uniform3f(U.uCam, ro[0], ro[1], ro[2]);
    gl.uniform3f(U.uC, cx, cy, 0);
    gl.uniform1f(U.uBound, (h > 0.01 ? 2.0 : 1.9) * S + 0.1);
    gl.uniform4fv(U.uB, balls);
    gl.uniform4f(U.uBead, bead.x, bead.y, 0, bead.r);
    gl.uniform4f(U.uTeth, pos[nearest][0], pos[nearest][1], pos[nearest][2], 0.016 * S * ease((near - 0.35) / 0.5));
    gl.uniform4f(U.uHalo, haloR, 0.045 * S * h, haloTilt, t * 0.3);
    gl.uniform4fv(U.uP, pulses);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Labels, placed off each droplet's upper right.
    if (labels.length) {
      var la = (1 - ease((m - 0.2) / 0.3)) * linkGrow;
      for (var n = 0; n < 5; n++) {
        var s = project(pos[n]), rp = balls[n * 4 + 3] * s.s;
        place(labels[n], s.x + rp * 0.72 + 6, s.y - rp * 0.72 - 6, la);
      }
      var yb = project([bead.x, bead.y, 0]);
      place(labels[5], yb.x + bead.r * yb.s + 8, yb.y - bead.r * yb.s - 4, ease((bead.r / (0.15 * S) - 0.6) / 0.4));
      var ha = project([cx + haloR * 0.72, cy + haloR * 0.42, 0]);
      place(labels[6], ha.x + 6, ha.y - 6, ease((h - 0.5) / 0.4));
    }
  }
  function place(el, x, y, o) {
    // Keep tags on screen: a droplet near the edge gets its tag pulled inward.
    x = Math.min(x, W - el.textContent.length * 7 - 30);
    el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    el.style.opacity = o.toFixed(3);
  }
  requestAnimationFrame(frame);

  window.Glass = {
    set: function (s) {
      for (var key in s) if (key in state && s[key] != null) state[key] = s[key];
    },
  };
})();
