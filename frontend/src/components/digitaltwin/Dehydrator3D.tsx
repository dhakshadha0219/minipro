import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  DoorClosed, 
  DoorOpen, 
  Eye,
  Wind,
  Flame,
  Thermometer,
  Info
} from 'lucide-react';
import { DigitalTwinState, SensorReading } from '../../types';

interface Dehydrator3DProps {
  sensor: SensorReading;
  twinState: DigitalTwinState;
  batchInfo?: {
    batch_id: string;
    product_name: string;
    status: string;
    progress: number;
  } | null;
  onToggleDoor?: () => void;
}

export const Dehydrator3D: React.FC<Dehydrator3DProps> = ({
  sensor,
  twinState,
  batchInfo,
  onToggleDoor
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isHeaterOn = twinState.heater === 'ON';
  const isFanOn = twinState.fan === 'ON';
  const isDoorStateOpen = twinState.door === 'OPEN';

  // Local door state can be toggled interactively
  const [localDoorOpen, setLocalDoorOpen] = useState(isDoorStateOpen);

  useEffect(() => {
    setLocalDoorOpen(twinState.door === 'OPEN');
  }, [twinState.door]);

  // Camera Orbit State refs
  const orbitRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotY: 0.45,   // horizontal yaw
    rotX: 0.22,   // vertical pitch
    distance: 6.2,
    targetRotY: 0.45,
    targetRotX: 0.22,
    targetDistance: 6.2,
    doorAngle: 0,
    targetDoorAngle: isDoorStateOpen ? 1.85 : 0
  });

  useEffect(() => {
    orbitRef.current.targetDoorAngle = localDoorOpen ? 1.85 : 0;
  }, [localDoorOpen]);

  // Controls UI callbacks
  const handleResetView = () => {
    orbitRef.current.targetRotY = 0.45;
    orbitRef.current.targetRotX = 0.22;
    orbitRef.current.targetDistance = 6.2;
  };

  const handleZoomIn = () => {
    orbitRef.current.targetDistance = Math.max(3.8, orbitRef.current.targetDistance - 0.8);
  };

  const handleZoomOut = () => {
    orbitRef.current.targetDistance = Math.min(9.5, orbitRef.current.targetDistance + 0.8);
  };

  const toggleDoor = () => {
    const next = !localDoorOpen;
    setLocalDoorOpen(next);
    if (onToggleDoor) onToggleDoor();
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = 440;

    // SCENE
    const scene = new THREE.Scene();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 6.2);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 8, 6);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.6);
    dirLight2.position.set(-5, -2, -4);
    scene.add(dirLight2);

    // Internal Heater Point Light (warms up internal chamber when ON)
    const heaterLight = new THREE.PointLight(0xff4500, 0, 8);
    heaterLight.position.set(0, -1.1, 0);
    scene.add(heaterLight);

    // Chamber Root Group
    const dehydratorGroup = new THREE.Group();
    scene.add(dehydratorGroup);

    // BASE / PEDESTAL
    const pedestalGeo = new THREE.BoxGeometry(4.2, 0.15, 2.8);
    const pedestalMat = new THREE.MeshStandardMaterial({ 
      color: 0x0f172a, 
      metalness: 0.7, 
      roughness: 0.4 
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.65;
    dehydratorGroup.add(pedestal);

    // 1. RECTANGULAR INDUSTRIAL DRYING CHAMBER CASING
    // Outer Chamber Shell (Navy/Steel)
    const chamberW = 3.8;
    const chamberH = 3.0;
    const chamberD = 2.4;
    const wallThick = 0.14;

    const metalCasingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.35
    });

    const innerLiningMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.25
    });

    // Top Wall
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(chamberW, wallThick, chamberD), metalCasingMat);
    topWall.position.set(0, chamberH / 2, 0);
    dehydratorGroup.add(topWall);

    // Bottom Wall
    const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(chamberW, wallThick, chamberD), metalCasingMat);
    bottomWall.position.set(0, -chamberH / 2, 0);
    dehydratorGroup.add(bottomWall);

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(chamberW, chamberH, wallThick), innerLiningMat);
    backWall.position.set(0, 0, -chamberD / 2);
    dehydratorGroup.add(backWall);

    // Left Wall (Housing blower intake)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, chamberH, chamberD), metalCasingMat);
    leftWall.position.set(-chamberW / 2, 0, 0);
    dehydratorGroup.add(leftWall);

    // Right Wall (With exhaust aperture & sensor mounts)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, chamberH, chamberD), metalCasingMat);
    rightWall.position.set(chamberW / 2, 0, 0);
    dehydratorGroup.add(rightWall);

    // Top Exhaust Chimney / Duct
    const exhaustDuct = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.45, 24),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 })
    );
    exhaustDuct.position.set(0.8, (chamberH / 2) + 0.25, 0);
    dehydratorGroup.add(exhaustDuct);

    // Exhaust Grille
    const exhaustGrille = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.33, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.5, wireframe: true })
    );
    exhaustGrille.position.set(0.8, (chamberH / 2) + 0.48, 0);
    dehydratorGroup.add(exhaustGrille);

    // 2. FORCED AIR BLOWER / FAN (Left interior wall)
    const fanHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.4 })
    );
    fanHousing.rotation.z = Math.PI / 2;
    fanHousing.position.set(-chamberW / 2 + 0.18, 0, 0);
    dehydratorGroup.add(fanHousing);

    // Fan Hub & Blades
    const fanBladesGroup = new THREE.Group();
    fanBladesGroup.position.set(-chamberW / 2 + 0.28, 0, 0);
    fanBladesGroup.rotation.y = Math.PI / 2;
    dehydratorGroup.add(fanBladesGroup);

    // Center Hub
    const fanHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 })
    );
    fanHub.rotation.x = Math.PI / 2;
    fanBladesGroup.add(fanHub);

    // 4 Curved Fan Blades
    const bladeGeo = new THREE.BoxGeometry(0.16, 0.48, 0.03);
    const bladeMat = new THREE.MeshStandardMaterial({ 
      color: 0x0284c7, 
      metalness: 0.9, 
      roughness: 0.2 
    });

    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = (b * Math.PI) / 2;
      blade.position.set(
        Math.cos((b * Math.PI) / 2) * 0.28,
        Math.sin((b * Math.PI) / 2) * 0.28,
        0
      );
      blade.rotation.x = 0.35; // aerodynamic pitch
      fanBladesGroup.add(blade);
    }

    // 3. HEATING ELEMENT (Serpentine heating coils at bottom)
    const heaterGroup = new THREE.Group();
    heaterGroup.position.set(0, -1.2, 0);
    dehydratorGroup.add(heaterGroup);

    const heaterMat = new THREE.MeshStandardMaterial({
      color: isHeaterOn ? 0xff3300 : 0x475569,
      emissive: isHeaterOn ? 0xff4500 : 0x000000,
      emissiveIntensity: isHeaterOn ? 1.8 : 0,
      metalness: 0.6,
      roughness: 0.3
    });

    // Coil tubes
    for (let c = -1.2; c <= 1.2; c += 0.45) {
      const coilBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 1.8, 16),
        heaterMat
      );
      coilBar.rotation.x = Math.PI / 2;
      coilBar.position.set(c, 0, 0);
      heaterGroup.add(coilBar);
    }

    // Connecting U-bends
    const bendGeo = new THREE.TorusGeometry(0.225, 0.045, 12, 16, Math.PI);
    for (let c = -1.2; c < 1.2; c += 0.9) {
      const bend1 = new THREE.Mesh(bendGeo, heaterMat);
      bend1.rotation.x = Math.PI / 2;
      bend1.position.set(c + 0.225, 0, 0.9);
      heaterGroup.add(bend1);

      const bend2 = new THREE.Mesh(bendGeo, heaterMat);
      bend2.rotation.x = Math.PI / 2;
      bend2.rotation.z = Math.PI;
      bend2.position.set(c + 0.675, 0, -0.9);
      heaterGroup.add(bend2);
    }

    // 4. STAINLESS-STEEL DRYING TRAYS (3 Tiers) & FOOD SAMPLES
    const trayHeights = [-0.6, 0.1, 0.8];
    const trayW = 2.4;
    const trayD = 1.9;

    const trayFrameMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.2
    });

    const trayMeshMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.9,
      roughness: 0.3,
      wireframe: true
    });

    // Color computation for food slices based on drying progress / moisture
    const progress = batchInfo ? batchInfo.progress : 60;
    const foodMat = new THREE.MeshStandardMaterial({
      color: progress >= 85 ? 0xd97706 : progress >= 45 ? 0xf59e0b : 0x84cc16,
      roughness: 0.5,
      metalness: 0.1
    });

    const foodSliceGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.035, 16);

    trayHeights.forEach((th, tIdx) => {
      // Tray Frame
      const trayFrame = new THREE.Mesh(
        new THREE.BoxGeometry(trayW, 0.04, trayD),
        trayFrameMat
      );
      trayFrame.position.set(0.2, th, 0);
      dehydratorGroup.add(trayFrame);

      // Stainless Wire Mesh Inner Surface
      const wireMesh = new THREE.Mesh(
        new THREE.BoxGeometry(trayW - 0.08, 0.02, trayD - 0.08),
        trayMeshMat
      );
      wireMesh.position.set(0.2, th + 0.01, 0);
      dehydratorGroup.add(wireMesh);

      // Food Slices arranged neatly on tray
      for (let rx = -0.9; rx <= 0.9; rx += 0.45) {
        for (let rz = -0.7; rz <= 0.7; rz += 0.45) {
          const slice = new THREE.Mesh(foodSliceGeo, foodMat);
          slice.position.set(0.2 + rx, th + 0.045, rz);
          dehydratorGroup.add(slice);
        }
      }
    });

    // 5. INTERNAL SENSOR PROBES
    // T1 Temperature Sensor (Top right wall)
    const tempSensor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 })
    );
    tempSensor.position.set(1.4, 0.95, -0.6);
    dehydratorGroup.add(tempSensor);

    // H1 Humidity Sensor (Mid right wall)
    const humSensor = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.18, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.3 })
    );
    humSensor.position.set(1.5, 0.25, -0.6);
    dehydratorGroup.add(humSensor);

    // M1 Moisture Pin Sensor (On middle tray sample)
    const moistProbe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.9, roughness: 0.1 })
    );
    moistProbe.position.set(0.2, 0.22, 0);
    dehydratorGroup.add(moistProbe);

    // 6. AIRFLOW PARTICLES STREAM
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = -1.2 + Math.random() * 2.4;
      particlePositions[p * 3 + 1] = -1.0 + Math.random() * 2.2;
      particlePositions[p * 3 + 2] = -0.7 + Math.random() * 1.4;

      particleVelocities.push({
        x: 0.02 + Math.random() * 0.03,
        y: 0.005 + Math.random() * 0.01,
        z: (Math.random() - 0.5) * 0.01
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.06,
      transparent: true,
      opacity: isFanOn ? 0.75 : 0.0,
      blending: THREE.AdditiveBlending
    });
    const airflowParticles = new THREE.Points(particleGeo, particleMat);
    dehydratorGroup.add(airflowParticles);

    // 7. VISIBLY TRANSPARENT FRONT GLASS DOOR WITH HINGE PIVOT
    // Door Pivot at left front edge
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-chamberW / 2 + 0.05, 0, chamberD / 2);
    dehydratorGroup.add(doorPivot);

    const doorW = chamberW - 0.15;
    const doorH = chamberH - 0.18;

    // Outer Door Frame
    const doorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25
    });

    const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(doorW, 0.08, 0.08), doorFrameMat);
    doorFrameTop.position.set(doorW / 2, doorH / 2, 0);
    doorPivot.add(doorFrameTop);

    const doorFrameBottom = new THREE.Mesh(new THREE.BoxGeometry(doorW, 0.08, 0.08), doorFrameMat);
    doorFrameBottom.position.set(doorW / 2, -doorH / 2, 0);
    doorPivot.add(doorFrameBottom);

    const doorFrameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, doorH, 0.08), doorFrameMat);
    doorFrameLeft.position.set(0.04, 0, 0);
    doorPivot.add(doorFrameLeft);

    const doorFrameRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, doorH, 0.08), doorFrameMat);
    doorFrameRight.position.set(doorW - 0.04, 0, 0);
    doorPivot.add(doorFrameRight);

    // Industrial Door Handle
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.95, roughness: 0.1 })
    );
    handle.position.set(doorW - 0.22, 0, 0.09);
    doorPivot.add(handle);

    // TRANSPARENT GLASS PANEL (Internal components completely visible through it!)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.32,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.88,
      ior: 1.45,
      reflectivity: 0.8
    });

    const glassPanel = new THREE.Mesh(
      new THREE.BoxGeometry(doorW - 0.12, doorH - 0.12, 0.03),
      glassMat
    );
    glassPanel.position.set(doorW / 2, 0, 0);
    doorPivot.add(glassPanel);

    // Glass Subtle Reflection Accent Bar
    const glassReflection = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, doorH - 0.3, 0.032),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
    );
    glassReflection.position.set(doorW * 0.35, 0, 0);
    doorPivot.add(glassReflection);

    // POINTER & TOUCH DRAG LISTENERS FOR 360-DEGREE ROTATION
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      orbitRef.current.isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      orbitRef.current.prevX = clientX;
      orbitRef.current.prevY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!orbitRef.current.isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - orbitRef.current.prevX;
      const deltaY = clientY - orbitRef.current.prevY;
      orbitRef.current.prevX = clientX;
      orbitRef.current.prevY = clientY;

      // Full 360 degree horizontal range
      orbitRef.current.targetRotY += deltaX * 0.008;
      // Clamped pitch range
      orbitRef.current.targetRotX = Math.max(-0.45, Math.min(0.65, orbitRef.current.targetRotX + deltaY * 0.006));
    };

    const onPointerUp = () => {
      orbitRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.targetDistance = Math.max(3.8, Math.min(9.5, orbitRef.current.targetDistance + e.deltaY * 0.004));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // ANIMATION RENDER LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation
      const orbit = orbitRef.current;
      orbit.rotY += (orbit.targetRotY - orbit.rotY) * 0.1;
      orbit.rotX += (orbit.targetRotX - orbit.rotX) * 0.1;
      orbit.distance += (orbit.targetDistance - orbit.distance) * 0.1;

      // Smooth door angle interpolation
      orbit.doorAngle += (orbit.targetDoorAngle - orbit.doorAngle) * 0.1;
      doorPivot.rotation.y = orbit.doorAngle;

      // Position camera around orbit
      camera.position.x = orbit.distance * Math.sin(orbit.rotY) * Math.cos(orbit.rotX);
      camera.position.y = orbit.distance * Math.sin(orbit.rotX);
      camera.position.z = orbit.distance * Math.cos(orbit.rotY) * Math.cos(orbit.rotX);
      camera.lookAt(0, 0, 0);

      // Blower Fan Rotation
      if (isFanOn) {
        fanBladesGroup.rotation.z += 0.22;
      }

      // Heater Coils Thermal Radiant Glow Pulse
      if (isHeaterOn) {
        const pulse = 1.4 + 0.4 * Math.sin(elapsed * 4.0);
        heaterMat.emissiveIntensity = pulse;
        heaterLight.intensity = pulse * 1.6;
      } else {
        heaterMat.emissiveIntensity = 0;
        heaterLight.intensity = 0;
      }

      // Airflow Particles Movement
      if (isFanOn) {
        particleMat.opacity = 0.8;
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let p = 0; p < particleCount; p++) {
          positions[p * 3] += particleVelocities[p].x;
          positions[p * 3 + 1] += particleVelocities[p].y;
          positions[p * 3 + 2] += particleVelocities[p].z;

          // Wrap around inside chamber
          if (positions[p * 3] > 1.5) {
            positions[p * 3] = -1.2;
            positions[p * 3 + 1] = -0.9 + Math.random() * 1.8;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      } else {
        particleMat.opacity = 0.0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // RESIZE LISTENER
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      dom.removeEventListener('wheel', onWheel);

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isHeaterOn, isFanOn, batchInfo?.progress]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-b from-slate-950 via-navy-950 to-slate-900 border border-slate-700/80 shadow-2xl select-none">
      {/* 3D Canvas Mount */}
      <div 
        ref={mountRef} 
        className="w-full h-[440px] cursor-grab active:cursor-grabbing flex items-center justify-center relative z-0" 
      />

      {/* Floating 3D Interaction Control Overlay Bar (Top-Left) */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs text-white shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-bold text-[11px] text-cyan-300 font-mono tracking-wide">360° INTERACTIVE 3D TWIN</span>
        <span className="text-slate-500 text-[10px] hidden sm:inline">• Drag mouse to rotate</span>
      </div>

      {/* Floating View Controls (Top-Right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-md transition-all active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-md transition-all active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-md transition-all active:scale-95 flex items-center gap-1 text-xs"
          title="Reset to Default Angle"
        >
          <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-semibold hidden md:inline">Reset</span>
        </button>
        <button
          onClick={toggleDoor}
          className={`px-2.5 py-1.5 rounded-lg border backdrop-blur-md shadow-md text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            localDoorOpen 
              ? 'bg-red-500/30 text-red-300 border-red-500/50 hover:bg-red-500/40 animate-pulse' 
              : 'bg-slate-900/85 text-slate-200 border-slate-700/80 hover:bg-slate-800'
          }`}
          title={localDoorOpen ? "Close Door to reset safety interlock" : "Open Door (Trips Door Safety Interlock)"}
        >
          {localDoorOpen ? <DoorOpen className="w-4 h-4 text-red-400" /> : <DoorClosed className="w-4 h-4 text-cyan-400" />}
          <span className="text-[11px] font-bold">{localDoorOpen ? 'Close Door (Tripped)' : 'Open Door'}</span>
        </button>
      </div>

      {/* Floating 3D Telemetry Badges (Overlaid on Bottom Corners) */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-2 shadow-lg">
          <Wind className={`w-3.5 h-3.5 ${isFanOn ? 'text-cyan-400 animate-spin-slow' : 'text-slate-500'}`} />
          <span className="text-[11px] text-slate-300">
            Blower: <strong className={isFanOn ? 'text-cyan-400' : 'text-slate-400'}>{twinState.fan}</strong>
          </span>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-2 shadow-lg">
          <Flame className={`w-3.5 h-3.5 ${isHeaterOn ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-[11px] text-slate-300">
            Heater: <strong className={isHeaterOn ? 'text-red-400' : 'text-slate-400'}>{twinState.heater}</strong>
          </span>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-2 shadow-lg">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] text-slate-300">
            Door Glass: <strong className="text-emerald-400">Transparent</strong>
          </span>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-10 hidden sm:flex items-center gap-2 pointer-events-none">
        <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm">
          3 Stainless Mesh Trays • Ceramic Heating Coils • Sensor Probes (T1, H1, M1)
        </span>
      </div>
    </div>
  );
};
