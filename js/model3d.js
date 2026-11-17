/* ============================================================
   MODEL3D — renderer WebGL reutilizável para acentos 3D ambientes.
   Usa a mesma geometria pré-processada (window.PORTFOLIO_MODELS).
   window.Model3D.create(canvas, {model, speed, interactive})
   ============================================================ */
(function () {
  'use strict';

  var VERT = 'attribute vec3 aPos;attribute vec3 aNormal;attribute vec3 aColor;uniform mat4 uRotation;uniform mat4 uProjection;uniform float uDist;varying vec3 vNormal;varying vec3 vColor;void main(){vec4 p=uRotation*vec4(aPos,1.0);vNormal=mat3(uRotation)*aNormal;vColor=aColor;gl_Position=uProjection*vec4(p.xyz+vec3(0.0,0.0,uDist),1.0);}';
  var FRAG = 'precision mediump float;varying vec3 vNormal;varying vec3 vColor;uniform float uUnlit;void main(){float light=0.56+0.44*abs(dot(normalize(vNormal),normalize(vec3(-0.4,0.8,1.0))));light=mix(light,1.0,uUnlit);vec3 color=pow(max(vColor*light,vec3(0.0)),vec3(1.0/2.2));gl_FragColor=vec4(color,1.0);}';

  function bytes(b64) {
    var raw = atob(b64), a = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i);
    return a;
  }

  function create(canvas, opts) {
    opts = opts || {};
    var models = window.PORTFOLIO_MODELS;
    if (!canvas || !models) return null;
    var modelId = opts.model || 'mesh';
    var speed = opts.speed == null ? 0.28 : opts.speed;
    var dist = opts.dist == null ? -3.9 : opts.dist;
    var interactive = !!opts.interactive;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)');

    var gl, program, parts = [], frame = 0, last = 0, time = 0;
    var visible = false, hidden = document.hidden, paused = reduce.matches;
    var yaw = 0.5, pitch = 0.18, drag = null;

    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true });
      if (!gl) throw new Error('no webgl');

      function shader(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      }
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);

      var aPos = gl.getAttribLocation(program, 'aPos'),
          aNormal = gl.getAttribLocation(program, 'aNormal'),
          aColor = gl.getAttribLocation(program, 'aColor'),
          uRot = gl.getUniformLocation(program, 'uRotation'),
          uProj = gl.getUniformLocation(program, 'uProjection'),
          uUnlit = gl.getUniformLocation(program, 'uUnlit'),
          uDist = gl.getUniformLocation(program, 'uDist');
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      [aPos, aNormal, aColor].forEach(function (a) { gl.enableVertexAttribArray(a); });

      var model = models.find(function (m) { return m.id === modelId; }) || models[0];
      parts = model.parts.map(function (p) {
        var v = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, v);
        gl.bufferData(gl.ARRAY_BUFFER, bytes(p.vertices), gl.STATIC_DRAW);
        var i = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bytes(p.indices), gl.STATIC_DRAW);
        return { vertex: v, index: i, mode: p.mode, count: p.count, unlit: p.unlit };
      });

      function draw() {
        var w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight),
            dpr = Math.min(devicePixelRatio || 1, 2);
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        var aspect = w / h, f = 1 / Math.tan(0.72 / 2), near = 0.1, far = 30;
        gl.uniformMatrix4fv(uProj, false, new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]));
        gl.uniform1f(uDist, dist);
        var y = yaw + (!drag ? Math.sin(time * 0.3) * 0.18 : 0),
            x = pitch + (!drag ? Math.cos(time * 0.2) * 0.05 : 0),
            cy = Math.cos(y), sy = Math.sin(y), cx = Math.cos(x), sx = Math.sin(x);
        gl.uniformMatrix4fv(uRot, false, new Float32Array([cy, sx * sy, -cx * sy, 0, 0, cx, sx, 0, sy, -sx * cy, cx * cy, 0, 0, 0, 0, 1]));
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        parts.forEach(function (p) {
          gl.bindBuffer(gl.ARRAY_BUFFER, p.vertex);
          gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 36, 0);
          gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 36, 12);
          gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 36, 24);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.index);
          gl.uniform1f(uUnlit, p.unlit ? 1 : 0);
          gl.drawElements(p.mode, p.count, gl.UNSIGNED_SHORT, 0);
        });
      }

      function loop(now) {
        frame = 0;
        if (!visible || hidden || paused) return;
        if (last) { var dt = Math.min((now - last) / 1000, 0.05); time += dt; if (!drag) yaw += speed * dt; }
        last = now; draw();
        frame = requestAnimationFrame(loop);
      }
      function schedule() {
        cancelAnimationFrame(frame); frame = 0; last = 0; draw();
        if (visible && !hidden && !paused) frame = requestAnimationFrame(loop);
      }

      if (interactive) {
        canvas.style.touchAction = 'pan-y';
        canvas.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
        canvas.addEventListener('pointermove', function (e) { if (!drag) return; yaw += (e.clientX - drag.x) * 0.009; pitch = Math.max(-1.1, Math.min(1.1, pitch + (e.clientY - drag.y) * 0.007)); drag = { x: e.clientX, y: e.clientY }; draw(); });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { canvas.addEventListener(t, function () { drag = null; }); });
      }

      document.addEventListener('visibilitychange', function () { hidden = document.hidden; schedule(); });
      reduce.addEventListener('change', function () { paused = reduce.matches; schedule(); });
      new ResizeObserver(schedule).observe(canvas);
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; schedule(); }, { threshold: 0.02 }).observe(canvas);
      canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); cancelAnimationFrame(frame); canvas.style.display = 'none'; });
      schedule();
      return { el: canvas };
    } catch (err) {
      if (canvas) canvas.style.display = 'none';
      var fb = canvas && canvas.closest('[data-accent3d]');
      if (fb) fb.classList.add('accent3d--failed');
      return null;
    }
  }

  window.Model3D = { create: create };
})();
