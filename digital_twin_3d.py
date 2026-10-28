"""
Interactive 3D Three.js Digital Twin Dehydrator Component for Streamlit.
Renders real-time physical chamber twin synchronized with sensor telemetry.
"""

def get_digital_twin_html(sensor: dict, twin_state: dict, batch_info: dict = None) -> str:
    temp = float(sensor.get("temperature", 55.2))
    hum = float(sensor.get("humidity", 42.0))
    moist = float(sensor.get("moisture", 31.0))
    heater_on = twin_state.get("heater", "ON") == "ON"
    fan_on = twin_state.get("fan", "ON") == "ON"
    door_open = twin_state.get("door", "CLOSED") == "OPEN"
    status = twin_state.get("status", "NORMAL")
    batch_name = batch_info.get("product_name", "Apple Slices") if batch_info else "Apple Slices"
    progress = float(batch_info.get("progress", 72.0)) if batch_info else 72.0

    # Food color based on moisture %
    # High moisture (80%): #84cc16 (fresh yellow-green)
    # Mid moisture (45%): #f59e0b (golden drying)
    # Low moisture (15-20%): #92400e (crisp dehydrated brown)
    if moist > 60:
        slice_color_hex = 0x84cc16
    elif moist > 35:
        slice_color_hex = 0xf59e0b
    else:
        slice_color_hex = 0xb45309

    heater_js_bool = "true" if heater_on else "false"
    fan_js_bool = "true" if fan_on else "false"
    door_js_bool = "true" if door_open else "false"

    html_code = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body, html {{
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
    }}
    #container {{
      width: 100vw;
      height: 440px;
      position: relative;
    }}
    #overlay-header {{
      position: absolute;
      top: 12px;
      left: 14px;
      right: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
      z-index: 10;
    }}
    .tag {{
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(51, 65, 85, 0.8);
      color: #94a3b8;
      font-size: 11px;
      font-family: monospace;
      padding: 5px 10px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .tag-highlight {{
      color: #38bdf8;
      font-weight: 600;
    }}
    #hud-probes {{
      position: absolute;
      bottom: 12px;
      left: 14px;
      display: flex;
      gap: 8px;
      pointer-events: none;
      z-index: 10;
    }}
    .probe-card {{
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(51, 65, 85, 0.9);
      border-radius: 8px;
      padding: 6px 12px;
      color: #fff;
      font-family: monospace;
      font-size: 11px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }}
    .probe-title {{
      color: #64748b;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .probe-val {{
      font-size: 15px;
      font-weight: bold;
    }}
    .probe-temp {{ color: #f87171; }}
    .probe-hum {{ color: #60a5fa; }}
    .probe-moist {{ color: #34d399; }}
    #controls-toolbar {{
      position: absolute;
      bottom: 12px;
      right: 14px;
      display: flex;
      gap: 6px;
      z-index: 10;
    }}
    .btn-ctrl {{
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid #475569;
      color: #cbd5e1;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s;
    }}
    .btn-ctrl:hover {{
      background: #334155;
      color: #fff;
    }}
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <div id="container">
    <div id="overlay-header">
      <div class="tag">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#0284c7;"></span>
        <span>DT-CHAMBER-01 &bull; COMMERCIAL TRAY DEHYDRATOR (3D)</span>
      </div>
      <div class="tag">
        <span>EXHAUST DUCT:</span>
        <span class="tag-highlight">{'VENTILATING (1.4 m/s)' if fan_on else 'RESTING (0.0 m/s)'}</span>
      </div>
    </div>

    <div id="hud-probes">
      <div class="probe-card">
        <div class="probe-title">Sensor T1 &bull; Temp</div>
        <div class="probe-val probe-temp">{temp:.1f} <span style="font-size:10px; color:#94a3b8;">°C</span></div>
      </div>
      <div class="probe-card">
        <div class="probe-title">Sensor H1 &bull; Humidity</div>
        <div class="probe-val probe-hum">{hum:.1f} <span style="font-size:10px; color:#94a3b8;">%</span></div>
      </div>
      <div class="probe-card">
        <div class="probe-title">Sensor M1 &bull; Moisture</div>
        <div class="probe-val probe-moist">{moist:.1f} <span style="font-size:10px; color:#94a3b8;">%</span></div>
      </div>
    </div>

    <div id="controls-toolbar">
      <button class="btn-ctrl" onclick="resetCamera()">Reset View</button>
      <button class="btn-ctrl" onclick="zoomIn()">Zoom +</button>
      <button class="btn-ctrl" onclick="zoomOut()">Zoom -</button>
    </div>
  </div>

  <script>
    const container = document.getElementById('container');
    const width = container.clientWidth || 640;
    const height = 440;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.08);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(2.8, 1.8, 5.8);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({{ antialias: true, alpha: false }});
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // CONTROLS
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 9.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(0, 0.1, 0);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0x475569, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    // Interior LED lighting
    const interiorLed = new THREE.PointLight(0xe0f2fe, 1.0, 4.5);
    interiorLed.position.set(0, 1.2, 0.2);
    scene.add(interiorLed);

    // Heater Glow Light
    const heaterLight = new THREE.PointLight(0xff4500, {1.8 if heater_on else 0.0}, 3.5);
    heaterLight.position.set(0, -1.0, 0);
    scene.add(heaterLight);

    // FLOOR GRID
    const grid = new THREE.GridHelper(12, 24, 0x1e293b, 0x0f172a);
    grid.position.y = -1.6;
    scene.add(grid);

    // MATERIALS
    const metalMat = new THREE.MeshStandardMaterial({{
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.35
    }});
    const innerCavityMat = new THREE.MeshStandardMaterial({{
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.25
    }});
    const frameEdgeMat = new THREE.MeshStandardMaterial({{
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2
    }});
    const trayMat = new THREE.MeshStandardMaterial({{
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.3,
      wireframe: true
    }});
    const glassMat = new THREE.MeshPhysicalMaterial({{
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5
    }});
    const coilMat = new THREE.MeshStandardMaterial({{
      color: {0xff3300 if heater_on else 0x475569},
      emissive: {0xff2200 if heater_on else 0x000000},
      emissiveIntensity: {0.8 if heater_on else 0.0},
      roughness: 0.3
    }});

    // CHAMBER BODY (Outer casing)
    const chamberGroup = new THREE.Group();
    scene.add(chamberGroup);

    // Outer Back, Left, Right, Top, Bottom walls
    const w = 2.4, h = 2.8, d = 1.8, thick = 0.08;

    // Top
    const topMesh = new THREE.Mesh(new THREE.BoxGeometry(w, thick, d), metalMat);
    topMesh.position.set(0, h/2, 0);
    chamberGroup.add(topMesh);

    // Bottom
    const btmMesh = new THREE.Mesh(new THREE.BoxGeometry(w, thick, d), metalMat);
    btmMesh.position.set(0, -h/2, 0);
    chamberGroup.add(btmMesh);

    // Back
    const backMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick), innerCavityMat);
    backMesh.position.set(0, 0, -d/2);
    chamberGroup.add(backMesh);

    // Left Wall
    const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(thick, h, d), metalMat);
    leftMesh.position.set(-w/2, 0, 0);
    chamberGroup.add(leftMesh);

    // Right Wall
    const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(thick, h, d), metalMat);
    rightMesh.position.set(w/2, 0, 0);
    chamberGroup.add(rightMesh);

    // Chamber Feet / Stand
    for (let dx of [-0.95, 0.95]) {{
      for (let dz of [-0.7, 0.7]) {{
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.2, 12), frameEdgeMat);
        foot.position.set(dx, -h/2 - 0.1, dz);
        chamberGroup.add(foot);
      }}
    }}

    // Top Exhaust Chimney
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.35, 16), frameEdgeMat);
    exhaust.position.set(0, h/2 + 0.17, -0.3);
    chamberGroup.add(exhaust);

    // 4 WIRE MESH TRAYS & FOOD SLICES
    const trayYLevels = [-0.6, -0.15, 0.3, 0.75];
    const sliceGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12);
    const sliceMat = new THREE.MeshStandardMaterial({{
      color: {slice_color_hex},
      roughness: 0.6,
      metalness: 0.05
    }});

    trayYLevels.forEach((yLvl, idx) => {{
      // Tray shelf
      const tray = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.025, 1.4), trayMat);
      tray.position.set(0, yLvl, 0);
      chamberGroup.add(tray);

      // Tray support rails
      const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 1.4), frameEdgeMat);
      railL.position.set(-1.05, yLvl, 0);
      chamberGroup.add(railL);

      const railR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 1.4), frameEdgeMat);
      railR.position.set(1.05, yLvl, 0);
      chamberGroup.add(railR);

      // Apple Slices on this tray (4x3 grid)
      for (let r = -1; r <= 1; r++) {{
        for (let c = -1.5; c <= 1.5; c += 1.0) {{
          const slice = new THREE.Mesh(sliceGeo, sliceMat);
          const randOffset = (Math.sin(idx * 7 + r * 3 + c) * 0.04);
          slice.position.set(c * 0.5 + randOffset, yLvl + 0.02, r * 0.4 + randOffset);
          slice.rotation.y = (idx + r + c) * 0.6;
          // Shrink slightly if dry
          const scaleShrink = 0.8 + 0.2 * ({moist} / 80.0);
          slice.scale.set(scaleShrink, 1.0, scaleShrink);
          chamberGroup.add(slice);
        }}
      }}
    }});

    // HEATING COILS (Bottom ceramic radiant tubes)
    const coilGroup = new THREE.Group();
    for (let i = -0.7; i <= 0.7; i += 0.35) {{
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.8, 12), coilMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, -1.05, i);
      coilGroup.add(tube);
    }}
    chamberGroup.add(coilGroup);

    // CIRCULATION FAN (Mounted on back wall)
    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, 0.1, -d/2 + 0.06);

    const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 16), frameEdgeMat);
    fanHub.rotation.x = Math.PI / 2;
    fanGroup.add(fanHub);

    const fanBlades = new THREE.Group();
    for (let b = 0; b < 5; b++) {{
      const angle = (b / 5) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.015), metalMat);
      blade.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0);
      blade.rotation.z = angle + 0.3;
      blade.rotation.y = 0.25;
      fanBlades.add(blade);
    }}
    fanGroup.add(fanBlades);
    chamberGroup.add(fanGroup);

    // FRONT DOOR (Glass with bezel and hinge)
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-w/2, 0, d/2); // Hinge on front-left edge
    chamberGroup.add(doorPivot);

    const doorGroup = new THREE.Group();
    doorPivot.add(doorGroup);

    // Glass pane
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, h - 0.1, 0.03), glassMat);
    glass.position.set(w/2 - 0.05, 0, 0);
    doorGroup.add(glass);

    // Door Frame border
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), frameEdgeMat);
    doorFrame.position.set(w/2 - 0.05, 0, 0);
    // Wireframe edges
    const frameEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.04)),
      new THREE.LineBasicMaterial({{ color: 0x64748b, linewidth: 2 }})
    );
    doorFrame.add(frameEdges);
    doorGroup.add(doorFrame);

    // Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 12), frameEdgeMat);
    handle.position.set(w - 0.25, 0, 0.08);
    doorGroup.add(handle);

    // Set target door angle
    const isDoorOpen = {door_js_bool};
    doorPivot.rotation.y = isDoorOpen ? 1.6 : 0; // ~92 degrees open

    // SENSOR PROBE MARKERS (T1, H1, M1)
    function createProbeMarker(label, colorHex, pos) {{
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshBasicMaterial({{ color: colorHex }}));
      sphere.position.copy(pos);
      chamberGroup.add(sphere);

      const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.08, 16), new THREE.MeshBasicMaterial({{ color: colorHex, side: THREE.DoubleSide }}));
      ring.position.copy(pos);
      ring.position.z += 0.02;
      chamberGroup.add(ring);
    }}
    createProbeMarker("T1", 0xf87171, new THREE.Vector3(0.8, 0.4, 0.5));
    createProbeMarker("H1", 0x60a5fa, new THREE.Vector3(-0.8, 0.4, 0.5));
    createProbeMarker("M1", 0x34d399, new THREE.Vector3(0.0, -0.1, 0.3));

    // ANIMATION LOOP
    let isFanRunning = {fan_js_bool};
    let isHeaterRunning = {heater_js_bool};
    let clock = new THREE.Clock();

    function animate() {{
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Fan rotation
      if (isFanRunning) {{
        fanBlades.rotation.z -= delta * 12.0;
      }}

      // Subtle coil pulsation when heating
      if (isHeaterRunning) {{
        heaterLight.intensity = 1.6 + Math.sin(time * 5.0) * 0.3;
      }}

      controls.update();
      renderer.render(scene, camera);
    }}
    animate();

    // TOOLBAR CONTROLS
    function resetCamera() {{
      camera.position.set(2.8, 1.8, 5.8);
      controls.target.set(0, 0.1, 0);
    }}
    function zoomIn() {{
      camera.position.multiplyScalar(0.88);
    }}
    function zoomOut() {{
      camera.position.multiplyScalar(1.14);
    }}

    // RESIZE
    window.addEventListener('resize', () => {{
      const newW = container.clientWidth || 640;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    }});
  </script>
</body>
</html>
"""
    return html_code
