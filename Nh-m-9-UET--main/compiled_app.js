import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.jsx");import RefreshRuntime from "/@react-refresh";
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot) {
  if (!window.__vite_plugin_react_preamble_installed__) {
    throw new Error("@vitejs/plugin-react can't detect preamble. Something is wrong. See https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201");
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, "C:/Users/hien2/OneDrive/Desktop/game nhom 4/src/App.jsx " + id);
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _jsxFileName = "C:\\Users\\hien2\\OneDrive\\Desktop\\game nhom 4\\src\\App.jsx", _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$(), _s5 = $RefreshSig$(), _s6 = $RefreshSig$(), _s7 = $RefreshSig$();
import __vite__cjsImport2_react from "/node_modules/.vite/deps/react.js?v=e72dfcbd"; const React = __vite__cjsImport2_react.__esModule ? __vite__cjsImport2_react.default : __vite__cjsImport2_react; const useState = __vite__cjsImport2_react["useState"]; const useEffect = __vite__cjsImport2_react["useEffect"]; const useRef = __vite__cjsImport2_react["useRef"];
import { Canvas, useFrame, useThree } from "/node_modules/.vite/deps/@react-three_fiber.js?v=e72dfcbd";
import { Physics, useBox, usePlane, useRaycastVehicle, useCylinder } from "/node_modules/.vite/deps/@react-three_cannon.js?v=e72dfcbd";
import * as THREE from "/node_modules/.vite/deps/three.js?v=e72dfcbd";
import { useGLTF } from "/node_modules/.vite/deps/@react-three_drei.js?v=e72dfcbd";
import __vite__cjsImport7_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=e72dfcbd"; const _jsxDEV = __vite__cjsImport7_react_jsxDevRuntime["jsxDEV"];
function usePlayerControls() {
  _s();
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    reset: false
  });
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          setMovement((m) => ({
            ...m,
            forward: true
          }));
          break;
        case "KeyS":
        case "ArrowDown":
          setMovement((m) => ({
            ...m,
            backward: true
          }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setMovement((m) => ({
            ...m,
            left: true
          }));
          break;
        case "KeyD":
        case "ArrowRight":
          setMovement((m) => ({
            ...m,
            right: true
          }));
          break;
        case "Space":
          setMovement((m) => ({
            ...m,
            brake: true
          }));
          break;
        case "KeyR":
          setMovement((m) => ({
            ...m,
            reset: true
          }));
          break;
      }
    };
    const handleKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          setMovement((m) => ({
            ...m,
            forward: false
          }));
          break;
        case "KeyS":
        case "ArrowDown":
          setMovement((m) => ({
            ...m,
            backward: false
          }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setMovement((m) => ({
            ...m,
            left: false
          }));
          break;
        case "KeyD":
        case "ArrowRight":
          setMovement((m) => ({
            ...m,
            right: false
          }));
          break;
        case "Space":
          setMovement((m) => ({
            ...m,
            brake: false
          }));
          break;
        case "KeyR":
          setMovement((m) => ({
            ...m,
            reset: false
          }));
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  return movement;
}
_s(usePlayerControls, "ZRKRZd/nlEBvKI99maQjvzafomc=");
const WheelModel = ({
  leftSide
}) => {
  _s2();
  const {
    scene
  } = useGLTF("/models/car/default/wheel.glb");
  const copiedScene = React.useMemo(() => scene.clone(), [scene]);
  return /* @__PURE__ */ _jsxDEV("primitive", {
    object: copiedScene,
    rotation: [0, leftSide ? -Math.PI / 2 : Math.PI / 2, 0]
  }, void 0, false, {
    fileName: _jsxFileName,
    lineNumber: 87,
    columnNumber: 10
  }, void 0);
};
_s2(WheelModel, "+8usEPd9iTXSexNTiya8lIAfHC8=", false, function() {
  return [useGLTF];
});
_c = WheelModel;
const Wheel = _s3(React.forwardRef(_c2 = _s3(({
  radius = 0.25,
  width = 0.24,
  leftSide
}, ref) => {
  _s3();
  useCylinder(() => ({
    mass: 5,
    type: "Kinematic",
    material: "wheel",
    collisionFilterGroup: 0,
    collisionFilterMask: 0,
    args: [radius, radius, width, 16]
  }), ref);
  return /* @__PURE__ */ _jsxDEV("mesh", {
    ref,
    children: /* @__PURE__ */ _jsxDEV(React.Suspense, {
      fallback: null,
      children: /* @__PURE__ */ _jsxDEV(WheelModel, {
        leftSide
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 103,
        columnNumber: 9
      }, void 0)
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 102,
      columnNumber: 7
    }, void 0)
  }, void 0, false, {
    fileName: _jsxFileName,
    lineNumber: 101,
    columnNumber: 5
  }, void 0);
}, "wtl6xIVX8zMDUsrMWUFypSe+xfk=", false, function() {
  return [useCylinder];
})), "wtl6xIVX8zMDUsrMWUFypSe+xfk=", false, function() {
  return [useCylinder];
});
_c3 = Wheel;
const CarModels = ({
  controls
}) => {
  _s4();
  const {
    scene: chassisScene
  } = useGLTF("/models/car/default/chassis.glb");
  const {
    scene: brakeScene
  } = useGLTF("/models/car/default/backLightsBrake.glb");
  const {
    scene: reverseScene
  } = useGLTF("/models/car/default/backLightsReverse.glb");
  const {
    scene: antenaScene
  } = useGLTF("/models/car/default/antena.glb");
  return /* @__PURE__ */ _jsxDEV("group", {
    position: [0, -0.25, 0],
    rotation: [0, Math.PI / 2, 0],
    children: [/* @__PURE__ */ _jsxDEV("primitive", {
      object: chassisScene
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 117,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV("primitive", {
      object: antenaScene
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 118,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV("primitive", {
      object: brakeScene,
      visible: controls.brake
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 119,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV("primitive", {
      object: reverseScene,
      visible: controls.backward
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 120,
      columnNumber: 7
    }, void 0)]
  }, void 0, true, {
    fileName: _jsxFileName,
    lineNumber: 116,
    columnNumber: 5
  }, void 0);
};
_s4(CarModels, "Lagt1HOMhn5/IFNXxJQUGdfhPKY=", false, function() {
  return [useGLTF, useGLTF, useGLTF, useGLTF];
});
_c4 = CarModels;
const Car = () => {
  _s5();
  const controls = usePlayerControls();
  const {
    camera
  } = useThree();
  const chassisWidth = 0.8;
  const chassisHeight = 0.5;
  const chassisDepth = 2.03;
  const [chassisRef, chassisApi] = useBox(() => ({
    mass: 20,
    position: [0, 0.5, 0],
    args: [chassisWidth, chassisHeight, chassisDepth],
    allowSleep: false
  }));
  const wheelRadius = 0.25;
  const wheelHeight = 0.24;
  const wInfo = {
    radius: wheelRadius,
    directionLocal: [0, -1, 0],
    suspensionStiffness: 25,
    suspensionRestLength: 0.1,
    maxSuspensionForce: 1e5,
    maxSuspensionTravel: 0.3,
    dampingRelaxation: 1.8,
    dampingCompression: 1.5,
    frictionSlip: 5,
    rollInfluence: 0.01,
    axleLocal: [-1, 0, 0],
    useCustomSlidingRotationalSpeed: false,
    customSlidingRotationalSpeed: -30
  };
  const frontOffset = -0.635;
  const backOffset = 0.475;
  const offsetWidth = 0.55;
  const wheelInfos = [{
    ...wInfo,
    chassisConnectionPointLocal: [-offsetWidth, 0, frontOffset],
    isFrontWheel: true
  }, {
    ...wInfo,
    chassisConnectionPointLocal: [offsetWidth, 0, frontOffset],
    isFrontWheel: true
  }, {
    ...wInfo,
    chassisConnectionPointLocal: [-offsetWidth, 0, backOffset],
    isFrontWheel: false
  }, {
    ...wInfo,
    chassisConnectionPointLocal: [offsetWidth, 0, backOffset],
    isFrontWheel: false
  }];
  const wheel0 = useRef(null);
  const wheel1 = useRef(null);
  const wheel2 = useRef(null);
  const wheel3 = useRef(null);
  const [vehicle, vehicleApi] = useRaycastVehicle(() => ({
    chassisBody: chassisRef,
    wheelInfos,
    wheels: [wheel0, wheel1, wheel2, wheel3],
    indexForwardAxis: 2,
    indexRightAxis: 0,
    indexUpAxis: 1
  }));
  const currentSteering = useRef(0);
  const cameraSettings = useRef({
    distance: 7,
    angleX: 0,
    angleY: 0.4
  });
  useEffect(() => {
    const handleWheel = (e) => {
      cameraSettings.current.distance += e.deltaY * 0.01;
      cameraSettings.current.distance = Math.max(3, Math.min(25, cameraSettings.current.distance));
    };
    let isMiddleMouseDown = false;
    const handlePointerDown = (e) => {
      if (e.button === 1)
        isMiddleMouseDown = true;
    };
    const handlePointerUp = (e) => {
      if (e.button === 1)
        isMiddleMouseDown = false;
    };
    const handlePointerMove = (e) => {
      if (isMiddleMouseDown) {
        cameraSettings.current.angleX -= e.movementX * 5e-3;
        cameraSettings.current.angleY += e.movementY * 5e-3;
        cameraSettings.current.angleY = Math.max(0.1, Math.min(Math.PI / 2.2, cameraSettings.current.angleY));
      }
    };
    window.addEventListener("wheel", handleWheel);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);
  useFrame((state, delta) => {
    const {
      forward,
      backward,
      left,
      right,
      brake,
      reset
    } = controls;
    if (reset && chassisRef.current) {
      chassisApi.position.set(chassisRef.current.position.x, chassisRef.current.position.y + 0.5, chassisRef.current.position.z);
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.rotation.set(0, chassisRef.current.rotation.y, 0);
    }
    const engineForce = 20;
    const maxSteerVal = Math.PI * 0.17;
    const steerSpeed = delta * 5;
    if (left) {
      currentSteering.current += steerSpeed;
    } else if (right) {
      currentSteering.current -= steerSpeed;
    } else {
      if (Math.abs(currentSteering.current) > steerSpeed) {
        currentSteering.current -= steerSpeed * Math.sign(currentSteering.current);
      } else {
        currentSteering.current = 0;
      }
    }
    if (Math.abs(currentSteering.current) > maxSteerVal) {
      currentSteering.current = Math.sign(currentSteering.current) * maxSteerVal;
    }
    vehicleApi.setSteeringValue(currentSteering.current, 0);
    vehicleApi.setSteeringValue(currentSteering.current, 1);
    if (forward) {
      vehicleApi.applyEngineForce(engineForce, 2);
      vehicleApi.applyEngineForce(engineForce, 3);
    } else if (backward) {
      vehicleApi.applyEngineForce(-engineForce, 2);
      vehicleApi.applyEngineForce(-engineForce, 3);
    } else {
      vehicleApi.applyEngineForce(0, 2);
      vehicleApi.applyEngineForce(0, 3);
    }
    if (brake) {
      vehicleApi.setBrake(0.45, 0);
      vehicleApi.setBrake(0.45, 1);
      vehicleApi.setBrake(0.45, 2);
      vehicleApi.setBrake(0.45, 3);
    } else {
      vehicleApi.setBrake(0, 0);
      vehicleApi.setBrake(0, 1);
      vehicleApi.setBrake(0, 2);
      vehicleApi.setBrake(0, 3);
    }
    if (chassisRef.current) {
      const currentPosition = new THREE.Vector3();
      chassisRef.current.getWorldPosition(currentPosition);
      const currentRotation = chassisRef.current.rotation.y;
      const dist = cameraSettings.current.distance;
      const ax = cameraSettings.current.angleX;
      const ay = cameraSettings.current.angleY;
      const horizontalDist = Math.cos(ay) * dist;
      const offsetX = Math.sin(ax) * horizontalDist;
      const offsetY = Math.sin(ay) * dist;
      const offsetZ = Math.cos(ax) * horizontalDist;
      const idealOffset = new THREE.Vector3(offsetX, offsetY, offsetZ);
      idealOffset.applyEuler(new THREE.Euler(0, currentRotation, 0));
      const idealPosition = currentPosition.clone().add(idealOffset);
      camera.position.lerp(idealPosition, delta * 10);
      const lookAtPos = currentPosition.clone().add(new THREE.Vector3(0, 0, -2).applyEuler(new THREE.Euler(0, currentRotation, 0)));
      camera.lookAt(lookAtPos);
    }
  });
  return /* @__PURE__ */ _jsxDEV("group", {
    ref: vehicle,
    children: [/* @__PURE__ */ _jsxDEV("mesh", {
      ref: chassisRef,
      castShadow: true,
      children: [/* @__PURE__ */ _jsxDEV("meshStandardMaterial", {
        visible: false
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 328,
        columnNumber: 9
      }, void 0), /* @__PURE__ */ _jsxDEV(React.Suspense, {
        fallback: null,
        children: /* @__PURE__ */ _jsxDEV(CarModels, {
          controls
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 331,
          columnNumber: 11
        }, void 0)
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 330,
        columnNumber: 9
      }, void 0)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 326,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV(Wheel, {
      ref: wheel0,
      radius: wheelRadius,
      width: wheelHeight,
      leftSide: true
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 334,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV(Wheel, {
      ref: wheel1,
      radius: wheelRadius,
      width: wheelHeight,
      leftSide: false
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 335,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV(Wheel, {
      ref: wheel2,
      radius: wheelRadius,
      width: wheelHeight,
      leftSide: true
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 336,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV(Wheel, {
      ref: wheel3,
      radius: wheelRadius,
      width: wheelHeight,
      leftSide: false
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 337,
      columnNumber: 7
    }, void 0)]
  }, void 0, true, {
    fileName: _jsxFileName,
    lineNumber: 325,
    columnNumber: 5
  }, void 0);
};
_s5(Car, "51rMaTGfrJpPIrDXPa9yfrvz5H8=", false, function() {
  return [usePlayerControls, useThree, useBox, useRaycastVehicle, useFrame];
});
_c5 = Car;
const Ground = () => {
  _s6();
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0]
  }));
  return /* @__PURE__ */ _jsxDEV("mesh", {
    ref,
    receiveShadow: true,
    children: [/* @__PURE__ */ _jsxDEV("planeGeometry", {
      args: [1e3, 1e3]
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 350,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV("meshStandardMaterial", {
      color: "#0a0a1a"
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 351,
      columnNumber: 7
    }, void 0)]
  }, void 0, true, {
    fileName: _jsxFileName,
    lineNumber: 349,
    columnNumber: 5
  }, void 0);
};
_s6(Ground, "ZXiOMq8W1xHEoXd0svPT/ZkHa4A=", false, function() {
  return [usePlane];
});
_c6 = Ground;
const Obstacle = ({
  position,
  color,
  args = [2, 2, 2]
}) => {
  _s7();
  const [ref] = useBox(() => ({
    type: "Static",
    position,
    args
  }));
  return /* @__PURE__ */ _jsxDEV("mesh", {
    ref,
    castShadow: true,
    receiveShadow: true,
    children: [/* @__PURE__ */ _jsxDEV("boxGeometry", {
      args
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 361,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV("meshStandardMaterial", {
      color,
      emissive: color,
      emissiveIntensity: 0.4
    }, void 0, false, {
      fileName: _jsxFileName,
      lineNumber: 362,
      columnNumber: 7
    }, void 0), /* @__PURE__ */ _jsxDEV("mesh", {
      children: [/* @__PURE__ */ _jsxDEV("boxGeometry", {
        args: [args[0] + 0.01, args[1] + 0.01, args[2] + 0.01]
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 365,
        columnNumber: 9
      }, void 0), /* @__PURE__ */ _jsxDEV("meshBasicMaterial", {
        color: "#ffffff",
        wireframe: true
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 366,
        columnNumber: 9
      }, void 0)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 364,
      columnNumber: 7
    }, void 0)]
  }, void 0, true, {
    fileName: _jsxFileName,
    lineNumber: 360,
    columnNumber: 5
  }, void 0);
};
_s7(Obstacle, "jfIH16j7OOVQjoqs7b3xTcl4hLc=", false, function() {
  return [useBox];
});
_c7 = Obstacle;
export default function App() {
  return /* @__PURE__ */ _jsxDEV("div", {
    style: {
      width: "100vw",
      height: "100vh",
      background: "#020205",
      margin: 0,
      padding: 0,
      overflow: "hidden"
    },
    children: [/* @__PURE__ */ _jsxDEV(Canvas, {
      shadows: true,
      camera: {
        position: [0, 5, 10],
        fov: 60
      },
      children: [/* @__PURE__ */ _jsxDEV("ambientLight", {
        intensity: 0.1
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 377,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV("directionalLight", {
        position: [10, 20, 10],
        intensity: 1,
        castShadow: true
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 378,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV("pointLight", {
        position: [0, 10, 0],
        intensity: 5,
        color: "#ff00ff",
        distance: 50
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 379,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV("gridHelper", {
        args: [1e3, 100, "#ff00aa", "#111133"],
        position: [0, 0.01, 0]
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 382,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV(Physics, {
        gravity: [0, -3.25, 0],
        defaultContactMaterial: {
          friction: 0,
          restitution: 0.2
        },
        children: [/* @__PURE__ */ _jsxDEV(Car, {}, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 386,
          columnNumber: 11
        }, this), /* @__PURE__ */ _jsxDEV(Ground, {}, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 387,
          columnNumber: 11
        }, this), /* @__PURE__ */ _jsxDEV(Obstacle, {
          position: [10, 2, -20],
          color: "#ff00aa",
          args: [4, 4, 4]
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 390,
          columnNumber: 11
        }, this), /* @__PURE__ */ _jsxDEV(Obstacle, {
          position: [-10, 2, -40],
          color: "#00ffff",
          args: [4, 4, 4]
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 391,
          columnNumber: 11
        }, this), /* @__PURE__ */ _jsxDEV(Obstacle, {
          position: [5, 1.5, -60],
          color: "#ffff00",
          args: [15, 3, 3]
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 392,
          columnNumber: 11
        }, this), /* @__PURE__ */ _jsxDEV(Obstacle, {
          position: [-15, 2, -80],
          color: "#ff00aa",
          args: [4, 4, 4]
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 393,
          columnNumber: 11
        }, this), /* @__PURE__ */ _jsxDEV(Obstacle, {
          position: [20, 2, -100],
          color: "#00ffff",
          args: [4, 4, 4]
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 394,
          columnNumber: 11
        }, this), /* @__PURE__ */ _jsxDEV(Obstacle, {
          position: [0, 1.5, -120],
          color: "#ff00aa",
          args: [10, 3, 3]
        }, void 0, false, {
          fileName: _jsxFileName,
          lineNumber: 395,
          columnNumber: 11
        }, this)]
      }, void 0, true, {
        fileName: _jsxFileName,
        lineNumber: 385,
        columnNumber: 9
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 375,
      columnNumber: 7
    }, this), /* @__PURE__ */ _jsxDEV("div", {
      style: {
        position: "absolute",
        top: 30,
        left: 30,
        color: "white",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        textShadow: "0 0 10px #ff00aa",
        pointerEvents: "none"
      },
      children: [/* @__PURE__ */ _jsxDEV("h1", {
        style: {
          margin: 0,
          fontSize: "2rem"
        },
        children: "Neon Drift Racing"
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 405,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV("p", {
        style: {
          fontSize: "1.2rem",
          marginTop: "10px"
        },
        children: "W, A, S, D / Arrows - Drive"
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 406,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV("p", {
        style: {
          fontSize: "1.2rem"
        },
        children: "Space - Brake"
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 407,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV("p", {
        style: {
          fontSize: "1.2rem"
        },
        children: "R - Reset / L\u1EADt l\u1EA1i xe"
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 408,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV("p", {
        style: {
          fontSize: "1.2rem",
          color: "#00ffff"
        },
        children: "Scroll Mouse - Zoom In/Out"
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 409,
        columnNumber: 9
      }, this), /* @__PURE__ */ _jsxDEV("p", {
        style: {
          fontSize: "1.2rem",
          color: "#00ffff"
        },
        children: "Middle Click + Drag - Xoay Camera"
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 410,
        columnNumber: 9
      }, this)]
    }, void 0, true, {
      fileName: _jsxFileName,
      lineNumber: 400,
      columnNumber: 7
    }, this)]
  }, void 0, true, {
    fileName: _jsxFileName,
    lineNumber: 374,
    columnNumber: 5
  }, this);
}
_c8 = App;
useGLTF.preload("/models/car/default/chassis.glb");
useGLTF.preload("/models/car/default/wheel.glb");
useGLTF.preload("/models/car/default/backLightsBrake.glb");
useGLTF.preload("/models/car/default/backLightsReverse.glb");
useGLTF.preload("/models/car/default/antena.glb");
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
$RefreshReg$(_c, "WheelModel");
$RefreshReg$(_c2, "Wheel$React.forwardRef");
$RefreshReg$(_c3, "Wheel");
$RefreshReg$(_c4, "CarModels");
$RefreshReg$(_c5, "Car");
$RefreshReg$(_c6, "Ground");
$RefreshReg$(_c7, "Obstacle");
$RefreshReg$(_c8, "App");
if (import.meta.hot) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
  import.meta.hot.accept();
  if (!window.__vite_plugin_react_timeout) {
    window.__vite_plugin_react_timeout = setTimeout(() => {
      window.__vite_plugin_react_timeout = 0;
      RefreshRuntime.performReactRefresh();
    }, 30);
  }
}

//# sourceMappingURL=data:application/json;base64,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QUMvQzlMLFFBQVE4TCxRQUFRLHlDQUF5QztBQUN6RDlMLFFBQVE4TCxRQUFRLDJDQUEyQztBQUMzRDlMLFFBQVE4TCxRQUFRLGdDQUFnQztBQUFFO0FBQUFDO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBO0FBQUFBIiwibmFtZXMiOlsiUmVhY3QiLCJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsInVzZVJlZiIsIkNhbnZhcyIsInVzZUZyYW1lIiwidXNlVGhyZWUiLCJQaHlzaWNzIiwidXNlQm94IiwidXNlUGxhbmUiLCJ1c2VSYXljYXN0VmVoaWNsZSIsInVzZUN5bGluZGVyIiwiVEhSRUUiLCJ1c2VHTFRGIiwidXNlUGxheWVyQ29udHJvbHMiLCJfcyIsIm1vdmVtZW50Iiwic2V0TW92ZW1lbnQiLCJmb3J3YXJkIiwiYmFja3dhcmQiLCJsZWZ0IiwicmlnaHQiLCJicmFrZSIsInJlc2V0IiwiaGFuZGxlS2V5RG93biIsImUiLCJjb2RlIiwibSIsImhhbmRsZUtleVVwIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIldoZWVsTW9kZWwiLCJsZWZ0U2lkZSIsIl9zMiIsInNjZW5lIiwiY29waWVkU2NlbmUiLCJ1c2VNZW1vIiwiY2xvbmUiLCJfanN4REVWIiwib2JqZWN0Iiwicm90YXRpb24iLCJNYXRoIiwiUEkiLCJfanN4RmlsZU5hbWUiLCJfYyIsIldoZWVsIiwiX3MzIiwiZm9yd2FyZFJlZiIsIl9jMiIsInJhZGl1cyIsIndpZHRoIiwicmVmIiwibWFzcyIsInR5cGUiLCJtYXRlcmlhbCIsImNvbGxpc2lvbkZpbHRlckdyb3VwIiwiY29sbGlzaW9uRmlsdGVyTWFzayIsImFyZ3MiLCJjaGlsZHJlbiIsIlN1c3BlbnNlIiwiZmFsbGJhY2siLCJfYzMiLCJDYXJNb2RlbHMiLCJjb250cm9scyIsIl9zNCIsImNoYXNzaXNTY2VuZSIsImJyYWtlU2NlbmUiLCJyZXZlcnNlU2NlbmUiLCJhbnRlbmFTY2VuZSIsInBvc2l0aW9uIiwidmlzaWJsZSIsIl9jNCIsIkNhciIsIl9zNSIsImNhbWVyYSIsImNoYXNzaXNXaWR0aCIsImNoYXNzaXNIZWlnaHQiLCJjaGFzc2lzRGVwdGgiLCJjaGFzc2lzUmVmIiwiY2hhc3Npc0FwaSIsImFsbG93U2xlZXAiLCJ3aGVlbFJhZGl1cyIsIndoZWVsSGVpZ2h0Iiwid0luZm8iLCJkaXJlY3Rpb25Mb2NhbCIsInN1c3BlbnNpb25TdGlmZm5lc3MiLCJzdXNwZW5zaW9uUmVzdExlbmd0aCIsIm1heFN1c3BlbnNpb25Gb3JjZSIsIm1heFN1c3BlbnNpb25UcmF2ZWwiLCJkYW1waW5nUmVsYXhhdGlvbiIsImRhbXBpbmdDb21wcmVzc2lvbiIsImZyaWN0aW9uU2xpcCIsInJvbGxJbmZsdWVuY2UiLCJheGxlTG9jYWwiLCJ1c2VDdXN0b21TbGlkaW5nUm90YXRpb25hbFNwZWVkIiwiY3VzdG9tU2xpZGluZ1JvdGF0aW9uYWxTcGVlZCIsImZyb250T2Zmc2V0IiwiYmFja09mZnNldCIsIm9mZnNldFdpZHRoIiwid2hlZWxJbmZvcyIsImNoYXNzaXNDb25uZWN0aW9uUG9pbnRMb2NhbCIsImlzRnJvbnRXaGVlbCIsIndoZWVsMCIsIndoZWVsMSIsIndoZWVsMiIsIndoZWVsMyIsInZlaGljbGUiLCJ2ZWhpY2xlQXBpIiwiY2hhc3Npc0JvZHkiLCJ3aGVlbHMiLCJpbmRleEZvcndhcmRBeGlzIiwiaW5kZXhSaWdodEF4aXMiLCJpbmRleFVwQXhpcyIsImN1cnJlbnRTdGVlcmluZyIsImNhbWVyYVNldHRpbmdzIiwiZGlzdGFuY2UiLCJhbmdsZVgiLCJhbmdsZVkiLCJoYW5kbGVXaGVlbCIsImN1cnJlbnQiLCJkZWx0YVkiLCJtYXgiLCJtaW4iLCJpc01pZGRsZU1vdXNlRG93biIsImhhbmRsZVBvaW50ZXJEb3duIiwiYnV0dG9uIiwiaGFuZGxlUG9pbnRlclVwIiwiaGFuZGxlUG9pbnRlck1vdmUiLCJtb3ZlbWVudFgiLCJtb3ZlbWVudFkiLCJ3aW5kb3ciLCJzdGF0ZSIsImRlbHRhIiwic2V0IiwieCIsInkiLCJ6IiwidmVsb2NpdHkiLCJhbmd1bGFyVmVsb2NpdHkiLCJlbmdpbmVGb3JjZSIsIm1heFN0ZWVyVmFsIiwic3RlZXJTcGVlZCIsImFicyIsInNpZ24iLCJzZXRTdGVlcmluZ1ZhbHVlIiwiYXBwbHlFbmdpbmVGb3JjZSIsInNldEJyYWtlIiwiY3VycmVudFBvc2l0aW9uIiwiVmVjdG9yMyIsImdldFdvcmxkUG9zaXRpb24iLCJjdXJyZW50Um90YXRpb24iLCJkaXN0IiwiYXgiLCJheSIsImhvcml6b250YWxEaXN0IiwiY29zIiwib2Zmc2V0WCIsInNpbiIsIm9mZnNldFkiLCJvZmZzZXRaIiwiaWRlYWxPZmZzZXQiLCJhcHBseUV1bGVyIiwiRXVsZXIiLCJpZGVhbFBvc2l0aW9uIiwiYWRkIiwibGVycCIsImxvb2tBdFBvcyIsImxvb2tBdCIsImNhc3RTaGFkb3ciLCJfYzUiLCJHcm91bmQiLCJfczYiLCJyZWNlaXZlU2hhZG93IiwiY29sb3IiLCJfYzYiLCJPYnN0YWNsZSIsIl9zNyIsImVtaXNzaXZlIiwiZW1pc3NpdmVJbnRlbnNpdHkiLCJ3aXJlZnJhbWUiLCJfYzciLCJBcHAiLCJzdHlsZSIsImhlaWdodCIsImJhY2tncm91bmQiLCJtYXJnaW4iLCJwYWRkaW5nIiwib3ZlcmZsb3ciLCJzaGFkb3dzIiwiZm92IiwiaW50ZW5zaXR5IiwiZ3Jhdml0eSIsImRlZmF1bHRDb250YWN0TWF0ZXJpYWwiLCJmcmljdGlvbiIsInJlc3RpdHV0aW9uIiwidG9wIiwiZm9udEZhbWlseSIsInRleHRTaGFkb3ciLCJwb2ludGVyRXZlbnRzIiwiZm9udFNpemUiLCJtYXJnaW5Ub3AiLCJfYzgiLCJwcmVsb2FkIiwiJFJlZnJlc2hSZWckIl0sInNvdXJjZXMiOlsiQzovVXNlcnMvaGllbjIvT25lRHJpdmUvRGVza3RvcC9nYW1lIG5ob20gNC9zcmMvQXBwLmpzeCJdLCJmaWxlIjoiQzovVXNlcnMvaGllbjIvT25lRHJpdmUvRGVza3RvcC9nYW1lIG5ob20gNC9zcmMvQXBwLmpzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBDYW52YXMsIHVzZUZyYW1lLCB1c2VUaHJlZSB9IGZyb20gJ0ByZWFjdC10aHJlZS9maWJlcic7XG5pbXBvcnQgeyBQaHlzaWNzLCB1c2VCb3gsIHVzZVBsYW5lLCB1c2VSYXljYXN0VmVoaWNsZSwgdXNlQ3lsaW5kZXIgfSBmcm9tICdAcmVhY3QtdGhyZWUvY2Fubm9uJztcbmltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IHVzZUdMVEYgfSBmcm9tICdAcmVhY3QtdGhyZWUvZHJlaSc7XG5cbi8vIDEuIEhvb2sgZm9yIGtleWJvYXJkIGlucHV0IChzaW1wbGUgYW5kIHN0YW5kYXJkIGZvciBiZWdpbm5lcnMpXG5mdW5jdGlvbiB1c2VQbGF5ZXJDb250cm9scygpIHtcbiAgY29uc3QgW21vdmVtZW50LCBzZXRNb3ZlbWVudF0gPSB1c2VTdGF0ZSh7XG4gICAgZm9yd2FyZDogZmFsc2UsXG4gICAgYmFja3dhcmQ6IGZhbHNlLFxuICAgIGxlZnQ6IGZhbHNlLFxuICAgIHJpZ2h0OiBmYWxzZSxcbiAgICBicmFrZTogZmFsc2UsXG4gICAgcmVzZXQ6IGZhbHNlXG4gIH0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlKSA9PiB7XG4gICAgICBzd2l0Y2ggKGUuY29kZSkge1xuICAgICAgICBjYXNlICdLZXlXJzpcbiAgICAgICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgICAgICAgc2V0TW92ZW1lbnQoKG0pID0+ICh7IC4uLm0sIGZvcndhcmQ6IHRydWUgfSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdLZXlTJzpcbiAgICAgICAgY2FzZSAnQXJyb3dEb3duJzpcbiAgICAgICAgICBzZXRNb3ZlbWVudCgobSkgPT4gKHsgLi4ubSwgYmFja3dhcmQ6IHRydWUgfSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdLZXlBJzpcbiAgICAgICAgY2FzZSAnQXJyb3dMZWZ0JzpcbiAgICAgICAgICBzZXRNb3ZlbWVudCgobSkgPT4gKHsgLi4ubSwgbGVmdDogdHJ1ZSB9KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0tleUQnOlxuICAgICAgICBjYXNlICdBcnJvd1JpZ2h0JzpcbiAgICAgICAgICBzZXRNb3ZlbWVudCgobSkgPT4gKHsgLi4ubSwgcmlnaHQ6IHRydWUgfSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdTcGFjZSc6XG4gICAgICAgICAgc2V0TW92ZW1lbnQoKG0pID0+ICh7IC4uLm0sIGJyYWtlOiB0cnVlIH0pKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnS2V5Uic6XG4gICAgICAgICAgc2V0TW92ZW1lbnQoKG0pID0+ICh7IC4uLm0sIHJlc2V0OiB0cnVlIH0pKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlS2V5VXAgPSAoZSkgPT4ge1xuICAgICAgc3dpdGNoIChlLmNvZGUpIHtcbiAgICAgICAgY2FzZSAnS2V5Vyc6XG4gICAgICAgIGNhc2UgJ0Fycm93VXAnOlxuICAgICAgICAgIHNldE1vdmVtZW50KChtKSA9PiAoeyAuLi5tLCBmb3J3YXJkOiBmYWxzZSB9KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0tleVMnOlxuICAgICAgICBjYXNlICdBcnJvd0Rvd24nOlxuICAgICAgICAgIHNldE1vdmVtZW50KChtKSA9PiAoeyAuLi5tLCBiYWNrd2FyZDogZmFsc2UgfSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdLZXlBJzpcbiAgICAgICAgY2FzZSAnQXJyb3dMZWZ0JzpcbiAgICAgICAgICBzZXRNb3ZlbWVudCgobSkgPT4gKHsgLi4ubSwgbGVmdDogZmFsc2UgfSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdLZXlEJzpcbiAgICAgICAgY2FzZSAnQXJyb3dSaWdodCc6XG4gICAgICAgICAgc2V0TW92ZW1lbnQoKG0pID0+ICh7IC4uLm0sIHJpZ2h0OiBmYWxzZSB9KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1NwYWNlJzpcbiAgICAgICAgICBzZXRNb3ZlbWVudCgobSkgPT4gKHsgLi4ubSwgYnJha2U6IGZhbHNlIH0pKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnS2V5Uic6XG4gICAgICAgICAgc2V0TW92ZW1lbnQoKG0pID0+ICh7IC4uLm0sIHJlc2V0OiBmYWxzZSB9KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlEb3duKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGhhbmRsZUtleVVwKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleURvd24pO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBoYW5kbGVLZXlVcCk7XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiBtb3ZlbWVudDtcbn1cblxuY29uc3QgV2hlZWxNb2RlbCA9ICh7IGxlZnRTaWRlIH0pID0+IHtcbiAgY29uc3QgeyBzY2VuZSB9ID0gdXNlR0xURignL21vZGVscy9jYXIvZGVmYXVsdC93aGVlbC5nbGInKTtcbiAgY29uc3QgY29waWVkU2NlbmUgPSBSZWFjdC51c2VNZW1vKCgpID0+IHNjZW5lLmNsb25lKCksIFtzY2VuZV0pO1xuICByZXR1cm4gPHByaW1pdGl2ZSBvYmplY3Q9e2NvcGllZFNjZW5lfSByb3RhdGlvbj17WzAsIGxlZnRTaWRlID8gLU1hdGguUEkgLyAyIDogTWF0aC5QSSAvIDIsIDBdfSAvPjtcbn07XG5cbmNvbnN0IFdoZWVsID0gUmVhY3QuZm9yd2FyZFJlZigoeyByYWRpdXMgPSAwLjI1LCB3aWR0aCA9IDAuMjQsIGxlZnRTaWRlIH0sIHJlZikgPT4ge1xuICB1c2VDeWxpbmRlcigoKSA9PiAoe1xuICAgIG1hc3M6IDUsXG4gICAgdHlwZTogJ0tpbmVtYXRpYycsXG4gICAgbWF0ZXJpYWw6ICd3aGVlbCcsXG4gICAgY29sbGlzaW9uRmlsdGVyR3JvdXA6IDAsXG4gICAgY29sbGlzaW9uRmlsdGVyTWFzazogMCwgLy8gxJDhuqNtIGLhuqNvIGLDoW5oIHhlIGtow7RuZyBiYW8gZ2nhu50gdmEgY2jhuqFtIHbhuq10IGzDvSBnw6J5IGzhu5dpXG4gICAgYXJnczogW3JhZGl1cywgcmFkaXVzLCB3aWR0aCwgMTZdLFxuICB9KSwgcmVmKTtcblxuICByZXR1cm4gKFxuICAgIDxtZXNoIHJlZj17cmVmfT5cbiAgICAgIDxSZWFjdC5TdXNwZW5zZSBmYWxsYmFjaz17bnVsbH0+XG4gICAgICAgIDxXaGVlbE1vZGVsIGxlZnRTaWRlPXtsZWZ0U2lkZX0gLz5cbiAgICAgIDwvUmVhY3QuU3VzcGVuc2U+XG4gICAgPC9tZXNoPlxuICApO1xufSk7XG5cbmNvbnN0IENhck1vZGVscyA9ICh7IGNvbnRyb2xzIH0pID0+IHtcbiAgY29uc3QgeyBzY2VuZTogY2hhc3Npc1NjZW5lIH0gPSB1c2VHTFRGKCcvbW9kZWxzL2Nhci9kZWZhdWx0L2NoYXNzaXMuZ2xiJyk7XG4gIGNvbnN0IHsgc2NlbmU6IGJyYWtlU2NlbmUgfSA9IHVzZUdMVEYoJy9tb2RlbHMvY2FyL2RlZmF1bHQvYmFja0xpZ2h0c0JyYWtlLmdsYicpO1xuICBjb25zdCB7IHNjZW5lOiByZXZlcnNlU2NlbmUgfSA9IHVzZUdMVEYoJy9tb2RlbHMvY2FyL2RlZmF1bHQvYmFja0xpZ2h0c1JldmVyc2UuZ2xiJyk7XG4gIGNvbnN0IHsgc2NlbmU6IGFudGVuYVNjZW5lIH0gPSB1c2VHTFRGKCcvbW9kZWxzL2Nhci9kZWZhdWx0L2FudGVuYS5nbGInKTtcblxuICByZXR1cm4gKFxuICAgIDxncm91cCBwb3NpdGlvbj17WzAsIC0wLjI1LCAwXX0gcm90YXRpb249e1swLCBNYXRoLlBJIC8gMiwgMF19PlxuICAgICAgPHByaW1pdGl2ZSBvYmplY3Q9e2NoYXNzaXNTY2VuZX0gLz5cbiAgICAgIDxwcmltaXRpdmUgb2JqZWN0PXthbnRlbmFTY2VuZX0gLz5cbiAgICAgIDxwcmltaXRpdmUgb2JqZWN0PXticmFrZVNjZW5lfSB2aXNpYmxlPXtjb250cm9scy5icmFrZX0gLz5cbiAgICAgIDxwcmltaXRpdmUgb2JqZWN0PXtyZXZlcnNlU2NlbmV9IHZpc2libGU9e2NvbnRyb2xzLmJhY2t3YXJkfSAvPlxuICAgIDwvZ3JvdXA+XG4gICk7XG59O1xuXG4vLyAzLiBUaGUgQ2FyIChWZWhpY2xlKSB1c2luZyBSYXljYXN0VmVoaWNsZVxuY29uc3QgQ2FyID0gKCkgPT4ge1xuICBjb25zdCBjb250cm9scyA9IHVzZVBsYXllckNvbnRyb2xzKCk7XG4gIGNvbnN0IHsgY2FtZXJhIH0gPSB1c2VUaHJlZSgpO1xuXG4gIC8vIENoYXNzaXMgZGltZW5zaW9uc1xuICBjb25zdCBjaGFzc2lzV2lkdGggPSAwLjg7XG4gIGNvbnN0IGNoYXNzaXNIZWlnaHQgPSAwLjU7IC8vIMSQxrBhIHbhu4EgMC41IMSR4buDIGPDsyDEkeG7pyBNYXNzIEluZXJ0aWEsIGNo4buRbmcgbOG6rXQgeGUgKHBoeXNpY3MgZXhwbG9zaW9uKVxuICBjb25zdCBjaGFzc2lzRGVwdGggPSAyLjAzO1xuXG4gIGNvbnN0IFtjaGFzc2lzUmVmLCBjaGFzc2lzQXBpXSA9IHVzZUJveCgoKSA9PiAoeyBcbiAgICBtYXNzOiAyMCwgLy8gQ2h14bqpbiBHMTBcbiAgICBwb3NpdGlvbjogWzAsIDAuNSwgMF0sIC8vIFNwYXduIHPDoXQgbeG6t3QgxJHhuqV0IMSR4buDIGtow7RuZyBi4buLIG7hu5Uga2hpIGRyb3BcbiAgICBhcmdzOiBbY2hhc3Npc1dpZHRoLCBjaGFzc2lzSGVpZ2h0LCBjaGFzc2lzRGVwdGhdLFxuICAgIGFsbG93U2xlZXA6IGZhbHNlXG4gIH0pKTtcblxuICAvLyBXaGVlbHMgc2V0dXAgZnJvbSBHMTBcbiAgY29uc3Qgd2hlZWxSYWRpdXMgPSAwLjI1O1xuICBjb25zdCB3aGVlbEhlaWdodCA9IDAuMjQ7XG4gIFxuICBjb25zdCB3SW5mbyA9IHtcbiAgICByYWRpdXM6IHdoZWVsUmFkaXVzLFxuICAgIGRpcmVjdGlvbkxvY2FsOiBbMCwgLTEsIDBdLFxuICAgIHN1c3BlbnNpb25TdGlmZm5lc3M6IDI1LCAvLyBDaHXhuqluIEcxMFxuICAgIHN1c3BlbnNpb25SZXN0TGVuZ3RoOiAwLjEsIC8vIENodeG6qW4gRzEwXG4gICAgbWF4U3VzcGVuc2lvbkZvcmNlOiAxMDAwMDAsXG4gICAgbWF4U3VzcGVuc2lvblRyYXZlbDogMC4zLFxuICAgIGRhbXBpbmdSZWxheGF0aW9uOiAxLjgsXG4gICAgZGFtcGluZ0NvbXByZXNzaW9uOiAxLjUsXG4gICAgZnJpY3Rpb25TbGlwOiA1LFxuICAgIHJvbGxJbmZsdWVuY2U6IDAuMDEsXG4gICAgYXhsZUxvY2FsOiBbLTEsIDAsIDBdLFxuICAgIHVzZUN1c3RvbVNsaWRpbmdSb3RhdGlvbmFsU3BlZWQ6IGZhbHNlLFxuICAgIGN1c3RvbVNsaWRpbmdSb3RhdGlvbmFsU3BlZWQ6IC0zMCxcbiAgfTtcbiAgY29uc3QgZnJvbnRPZmZzZXQgPSAtMC42MzU7XG4gIGNvbnN0IGJhY2tPZmZzZXQgPSAwLjQ3NTtcbiAgY29uc3Qgb2Zmc2V0V2lkdGggPSAwLjU1O1xuXG4gIGNvbnN0IHdoZWVsSW5mb3MgPSBbXG4gICAgeyAuLi53SW5mbywgY2hhc3Npc0Nvbm5lY3Rpb25Qb2ludExvY2FsOiBbLW9mZnNldFdpZHRoLCAwLCBmcm9udE9mZnNldF0sIGlzRnJvbnRXaGVlbDogdHJ1ZSB9LFxuICAgIHsgLi4ud0luZm8sIGNoYXNzaXNDb25uZWN0aW9uUG9pbnRMb2NhbDogW29mZnNldFdpZHRoLCAwLCBmcm9udE9mZnNldF0sIGlzRnJvbnRXaGVlbDogdHJ1ZSB9LFxuICAgIHsgLi4ud0luZm8sIGNoYXNzaXNDb25uZWN0aW9uUG9pbnRMb2NhbDogWy1vZmZzZXRXaWR0aCwgMCwgYmFja09mZnNldF0sIGlzRnJvbnRXaGVlbDogZmFsc2UgfSxcbiAgICB7IC4uLndJbmZvLCBjaGFzc2lzQ29ubmVjdGlvblBvaW50TG9jYWw6IFtvZmZzZXRXaWR0aCwgMCwgYmFja09mZnNldF0sIGlzRnJvbnRXaGVlbDogZmFsc2UgfSxcbiAgXTtcblxuICBjb25zdCB3aGVlbDAgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHdoZWVsMSA9IHVzZVJlZihudWxsKTtcbiAgY29uc3Qgd2hlZWwyID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB3aGVlbDMgPSB1c2VSZWYobnVsbCk7XG5cbiAgY29uc3QgW3ZlaGljbGUsIHZlaGljbGVBcGldID0gdXNlUmF5Y2FzdFZlaGljbGUoKCkgPT4gKHtcbiAgICBjaGFzc2lzQm9keTogY2hhc3Npc1JlZixcbiAgICB3aGVlbEluZm9zLFxuICAgIHdoZWVsczogW3doZWVsMCwgd2hlZWwxLCB3aGVlbDIsIHdoZWVsM10sXG4gICAgaW5kZXhGb3J3YXJkQXhpczogMixcbiAgICBpbmRleFJpZ2h0QXhpczogMCxcbiAgICBpbmRleFVwQXhpczogMSxcbiAgfSkpO1xuXG5cbiAgY29uc3QgY3VycmVudFN0ZWVyaW5nID0gdXNlUmVmKDApOyAvLyDEkOG7gyBsw6BtIG3GsOG7o3QgdsO0IGzEg25nIGNodeG6qW4gRzEwXG4gIFxuICAvLyBDYW1lcmEgc2V0dGluZ3MgY2hvIHBow6lwIHpvb20gaW4vb3V0IHbDoCBwYW5cbiAgY29uc3QgY2FtZXJhU2V0dGluZ3MgPSB1c2VSZWYoe1xuICAgIGRpc3RhbmNlOiA3LFxuICAgIGFuZ2xlWDogMCxcbiAgICBhbmdsZVk6IDAuNFxuICB9KTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGhhbmRsZVdoZWVsID0gKGUpID0+IHtcbiAgICAgIGNhbWVyYVNldHRpbmdzLmN1cnJlbnQuZGlzdGFuY2UgKz0gZS5kZWx0YVkgKiAwLjAxO1xuICAgICAgY2FtZXJhU2V0dGluZ3MuY3VycmVudC5kaXN0YW5jZSA9IE1hdGgubWF4KDMsIE1hdGgubWluKDI1LCBjYW1lcmFTZXR0aW5ncy5jdXJyZW50LmRpc3RhbmNlKSk7XG4gICAgfTtcblxuICAgIGxldCBpc01pZGRsZU1vdXNlRG93biA9IGZhbHNlO1xuICAgIGNvbnN0IGhhbmRsZVBvaW50ZXJEb3duID0gKGUpID0+IHtcbiAgICAgIGlmIChlLmJ1dHRvbiA9PT0gMSkgaXNNaWRkbGVNb3VzZURvd24gPSB0cnVlO1xuICAgIH07XG4gICAgY29uc3QgaGFuZGxlUG9pbnRlclVwID0gKGUpID0+IHtcbiAgICAgIGlmIChlLmJ1dHRvbiA9PT0gMSkgaXNNaWRkbGVNb3VzZURvd24gPSBmYWxzZTtcbiAgICB9O1xuICAgIGNvbnN0IGhhbmRsZVBvaW50ZXJNb3ZlID0gKGUpID0+IHtcbiAgICAgIGlmIChpc01pZGRsZU1vdXNlRG93bikge1xuICAgICAgICBjYW1lcmFTZXR0aW5ncy5jdXJyZW50LmFuZ2xlWCAtPSBlLm1vdmVtZW50WCAqIDAuMDA1O1xuICAgICAgICBjYW1lcmFTZXR0aW5ncy5jdXJyZW50LmFuZ2xlWSArPSBlLm1vdmVtZW50WSAqIDAuMDA1O1xuICAgICAgICAvLyBHaeG7m2kgaOG6oW4gZ8OzYyBZIMSR4buDIGtow7RuZyBi4buLIGNodWkgeHXhu5FuZyDEkeG6pXQgaG/hurdjIGzDqm4gcXXDoSBjYW9cbiAgICAgICAgY2FtZXJhU2V0dGluZ3MuY3VycmVudC5hbmdsZVkgPSBNYXRoLm1heCgwLjEsIE1hdGgubWluKE1hdGguUEkgLyAyLjIsIGNhbWVyYVNldHRpbmdzLmN1cnJlbnQuYW5nbGVZKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIGhhbmRsZVdoZWVsKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVQb2ludGVyRG93bik7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZVBvaW50ZXJVcCk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgaGFuZGxlUG9pbnRlck1vdmUpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBoYW5kbGVXaGVlbCk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVQb2ludGVyRG93bik7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgaGFuZGxlUG9pbnRlclVwKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGhhbmRsZVBvaW50ZXJNb3ZlKTtcbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgLy8gQuG7jyBzdWJzY3JpYmUoKSBj4bunYSBQaHlzaWNzIMSRaSDEkeG7gyB0csOhbmggdmnhu4djIGLhuqV0IMSR4buTbmcgYuG7mSBnw6J5IHJ1bmcgbOG6r2MgKEppdHRlcikuXG4gIC8vIFRoYXkgdsOgbyDEkcOzLCBjaMO6bmcgdGEgc+G6vSDEkeG7jWMgdHLhu7FjIHRp4bq/cCB04burIGNoYXNzaXNSZWYuY3VycmVudCBt4buXaSBraHVuZyBow6xuaC5cblxuICB1c2VGcmFtZSgoc3RhdGUsIGRlbHRhKSA9PiB7XG4gICAgY29uc3QgeyBmb3J3YXJkLCBiYWNrd2FyZCwgbGVmdCwgcmlnaHQsIGJyYWtlLCByZXNldCB9ID0gY29udHJvbHM7XG4gICAgXG4gICAgLy8gTsO6dCBSIMSR4buDIGzhuq10IGzhuqFpIHhlXG4gICAgaWYgKHJlc2V0ICYmIGNoYXNzaXNSZWYuY3VycmVudCkge1xuICAgICAgY2hhc3Npc0FwaS5wb3NpdGlvbi5zZXQoY2hhc3Npc1JlZi5jdXJyZW50LnBvc2l0aW9uLngsIGNoYXNzaXNSZWYuY3VycmVudC5wb3NpdGlvbi55ICsgMC41LCBjaGFzc2lzUmVmLmN1cnJlbnQucG9zaXRpb24ueik7XG4gICAgICBjaGFzc2lzQXBpLnZlbG9jaXR5LnNldCgwLCAwLCAwKTtcbiAgICAgIGNoYXNzaXNBcGkuYW5ndWxhclZlbG9jaXR5LnNldCgwLCAwLCAwKTtcbiAgICAgIGNoYXNzaXNBcGkucm90YXRpb24uc2V0KDAsIGNoYXNzaXNSZWYuY3VycmVudC5yb3RhdGlvbi55LCAwKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbmdpbmVGb3JjZSA9IDIwOyAvLyBHaeG6o20gbOG7sWMgxJHhuql5IHh14buRbmcgMjAgxJHhu4Mga2jDtG5nIGLhu4sgYuG7kWMgxJHhuqd1IGRvIG3DtCBtZW4geG/huq9uXG4gICAgY29uc3QgbWF4U3RlZXJWYWwgPSBNYXRoLlBJICogMC4xNzsgLy8gQ2h14bqpbiBHMTBcbiAgICBjb25zdCBzdGVlclNwZWVkID0gZGVsdGEgKiA1OyAvLyBUxrDGoW5nIMSRxrDGoW5nIGRlbHRhKG1zKSAqIDAuMDA1IGPhu6dhIEcxMFxuICAgIFxuICAgIC8vIFN0ZWVyaW5nIG3GsOG7o3QgY2h14bqpbiBHMTBcbiAgICBpZiAobGVmdCkge1xuICAgICAgY3VycmVudFN0ZWVyaW5nLmN1cnJlbnQgKz0gc3RlZXJTcGVlZDtcbiAgICB9IGVsc2UgaWYgKHJpZ2h0KSB7XG4gICAgICBjdXJyZW50U3RlZXJpbmcuY3VycmVudCAtPSBzdGVlclNwZWVkO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoTWF0aC5hYnMoY3VycmVudFN0ZWVyaW5nLmN1cnJlbnQpID4gc3RlZXJTcGVlZCkge1xuICAgICAgICBjdXJyZW50U3RlZXJpbmcuY3VycmVudCAtPSBzdGVlclNwZWVkICogTWF0aC5zaWduKGN1cnJlbnRTdGVlcmluZy5jdXJyZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnRTdGVlcmluZy5jdXJyZW50ID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gR2nhu5tpIGjhuqFuIGfDs2MgbMOhaVxuICAgIGlmIChNYXRoLmFicyhjdXJyZW50U3RlZXJpbmcuY3VycmVudCkgPiBtYXhTdGVlclZhbCkge1xuICAgICAgY3VycmVudFN0ZWVyaW5nLmN1cnJlbnQgPSBNYXRoLnNpZ24oY3VycmVudFN0ZWVyaW5nLmN1cnJlbnQpICogbWF4U3RlZXJWYWw7XG4gICAgfVxuXG4gICAgdmVoaWNsZUFwaS5zZXRTdGVlcmluZ1ZhbHVlKGN1cnJlbnRTdGVlcmluZy5jdXJyZW50LCAwKTtcbiAgICB2ZWhpY2xlQXBpLnNldFN0ZWVyaW5nVmFsdWUoY3VycmVudFN0ZWVyaW5nLmN1cnJlbnQsIDEpO1xuXG4gICAgLy8gQWNjZWxlcmF0ZVxuICAgIGlmIChmb3J3YXJkKSB7XG4gICAgICAvLyDEkOG6o28gbmfGsOG7o2MgZOG6pXUgY+G7p2EgZW5naW5lIGZvcmNlIMSR4buDIHRp4bq/biDEkcO6bmcgaMaw4bubbmdcbiAgICAgIHZlaGljbGVBcGkuYXBwbHlFbmdpbmVGb3JjZShlbmdpbmVGb3JjZSwgMik7XG4gICAgICB2ZWhpY2xlQXBpLmFwcGx5RW5naW5lRm9yY2UoZW5naW5lRm9yY2UsIDMpO1xuICAgIH0gZWxzZSBpZiAoYmFja3dhcmQpIHtcbiAgICAgIHZlaGljbGVBcGkuYXBwbHlFbmdpbmVGb3JjZSgtZW5naW5lRm9yY2UsIDIpO1xuICAgICAgdmVoaWNsZUFwaS5hcHBseUVuZ2luZUZvcmNlKC1lbmdpbmVGb3JjZSwgMyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZlaGljbGVBcGkuYXBwbHlFbmdpbmVGb3JjZSgwLCAyKTtcbiAgICAgIHZlaGljbGVBcGkuYXBwbHlFbmdpbmVGb3JjZSgwLCAzKTtcbiAgICB9XG5cbiAgICAvLyBCcmFrZSAoQ2jhu4luaCBs4bqhaSBs4buxYyBwaGFuaCDEkcO6bmcgY2h14bqpbiAwLjQ1IGPhu6dhIEcxMCDEkeG7gyBraMO0bmcgYuG7iyBuaOG6pWMgxJHDrXQgeGUpXG4gICAgaWYgKGJyYWtlKSB7XG4gICAgICB2ZWhpY2xlQXBpLnNldEJyYWtlKDAuNDUsIDApO1xuICAgICAgdmVoaWNsZUFwaS5zZXRCcmFrZSgwLjQ1LCAxKTtcbiAgICAgIHZlaGljbGVBcGkuc2V0QnJha2UoMC40NSwgMik7XG4gICAgICB2ZWhpY2xlQXBpLnNldEJyYWtlKDAuNDUsIDMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ZWhpY2xlQXBpLnNldEJyYWtlKDAsIDApO1xuICAgICAgdmVoaWNsZUFwaS5zZXRCcmFrZSgwLCAxKTtcbiAgICAgIHZlaGljbGVBcGkuc2V0QnJha2UoMCwgMik7XG4gICAgICB2ZWhpY2xlQXBpLnNldEJyYWtlKDAsIDMpO1xuICAgIH1cblxuICAgIC8vIFNtb290aCBUaGlyZCBQZXJzb24gQ2FtZXJhICjEkOG7jWMgdHLhu7FjIHRp4bq/cCB04burIE1lc2ggxJHhu4Mga2jDtG5nIGLhu4sgcnVuZyBs4bqvYylcbiAgICBpZiAoY2hhc3Npc1JlZi5jdXJyZW50KSB7XG4gICAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgICAgY2hhc3Npc1JlZi5jdXJyZW50LmdldFdvcmxkUG9zaXRpb24oY3VycmVudFBvc2l0aW9uKTtcbiAgICAgIFxuICAgICAgY29uc3QgY3VycmVudFJvdGF0aW9uID0gY2hhc3Npc1JlZi5jdXJyZW50LnJvdGF0aW9uLnk7XG4gICAgICBcbiAgICAgIGNvbnN0IGRpc3QgPSBjYW1lcmFTZXR0aW5ncy5jdXJyZW50LmRpc3RhbmNlO1xuICAgICAgY29uc3QgYXggPSBjYW1lcmFTZXR0aW5ncy5jdXJyZW50LmFuZ2xlWDtcbiAgICAgIGNvbnN0IGF5ID0gY2FtZXJhU2V0dGluZ3MuY3VycmVudC5hbmdsZVk7XG4gICAgICBcbiAgICAgIC8vIFTDrW5oIHRvw6FuIHbhu4sgdHLDrSBjYW1lcmEgdGhlbyB04buNYSDEkeG7mSBj4bqndSAoU3BoZXJpY2FsKVxuICAgICAgY29uc3QgaG9yaXpvbnRhbERpc3QgPSBNYXRoLmNvcyhheSkgKiBkaXN0O1xuICAgICAgY29uc3Qgb2Zmc2V0WCA9IE1hdGguc2luKGF4KSAqIGhvcml6b250YWxEaXN0O1xuICAgICAgY29uc3Qgb2Zmc2V0WSA9IE1hdGguc2luKGF5KSAqIGRpc3Q7XG4gICAgICBjb25zdCBvZmZzZXRaID0gTWF0aC5jb3MoYXgpICogaG9yaXpvbnRhbERpc3Q7XG4gICAgICBcbiAgICAgIGNvbnN0IGlkZWFsT2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMob2Zmc2V0WCwgb2Zmc2V0WSwgb2Zmc2V0Wik7IFxuICAgICAgaWRlYWxPZmZzZXQuYXBwbHlFdWxlcihuZXcgVEhSRUUuRXVsZXIoMCwgY3VycmVudFJvdGF0aW9uLCAwKSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGlkZWFsUG9zaXRpb24gPSBjdXJyZW50UG9zaXRpb24uY2xvbmUoKS5hZGQoaWRlYWxPZmZzZXQpO1xuICAgICAgY2FtZXJhLnBvc2l0aW9uLmxlcnAoaWRlYWxQb3NpdGlvbiwgZGVsdGEgKiAxMCk7XG4gICAgICBcbiAgICAgIC8vIExvb2sgYXQgaMahaSB4YSByYSBwaMOtYSB0csaw4bubYyBt4buZdCBjaMO6dFxuICAgICAgY29uc3QgbG9va0F0UG9zID0gY3VycmVudFBvc2l0aW9uLmNsb25lKCkuYWRkKG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0yKS5hcHBseUV1bGVyKG5ldyBUSFJFRS5FdWxlcigwLCBjdXJyZW50Um90YXRpb24sIDApKSk7XG4gICAgICBjYW1lcmEubG9va0F0KGxvb2tBdFBvcyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gKFxuICAgIDxncm91cCByZWY9e3ZlaGljbGV9PlxuICAgICAgPG1lc2ggcmVmPXtjaGFzc2lzUmVmfSBjYXN0U2hhZG93PlxuICAgICAgICB7LyogQm94IFBoeXNpY3Mg4bqpbiAqL31cbiAgICAgICAgPG1lc2hTdGFuZGFyZE1hdGVyaWFsIHZpc2libGU9e2ZhbHNlfSAvPlxuICAgICAgICBcbiAgICAgICAgPFJlYWN0LlN1c3BlbnNlIGZhbGxiYWNrPXtudWxsfT5cbiAgICAgICAgICA8Q2FyTW9kZWxzIGNvbnRyb2xzPXtjb250cm9sc30gLz5cbiAgICAgICAgPC9SZWFjdC5TdXNwZW5zZT5cbiAgICAgIDwvbWVzaD5cbiAgICAgIDxXaGVlbCByZWY9e3doZWVsMH0gcmFkaXVzPXt3aGVlbFJhZGl1c30gd2lkdGg9e3doZWVsSGVpZ2h0fSBsZWZ0U2lkZT17dHJ1ZX0gLz5cbiAgICAgIDxXaGVlbCByZWY9e3doZWVsMX0gcmFkaXVzPXt3aGVlbFJhZGl1c30gd2lkdGg9e3doZWVsSGVpZ2h0fSBsZWZ0U2lkZT17ZmFsc2V9IC8+XG4gICAgICA8V2hlZWwgcmVmPXt3aGVlbDJ9IHJhZGl1cz17d2hlZWxSYWRpdXN9IHdpZHRoPXt3aGVlbEhlaWdodH0gbGVmdFNpZGU9e3RydWV9IC8+XG4gICAgICA8V2hlZWwgcmVmPXt3aGVlbDN9IHJhZGl1cz17d2hlZWxSYWRpdXN9IHdpZHRoPXt3aGVlbEhlaWdodH0gbGVmdFNpZGU9e2ZhbHNlfSAvPlxuICAgIDwvZ3JvdXA+XG4gICk7XG59O1xuXG4vLyA0LiBHcm91bmQgLyBUcmFja1xuY29uc3QgR3JvdW5kID0gKCkgPT4ge1xuICBjb25zdCBbcmVmXSA9IHVzZVBsYW5lKCgpID0+ICh7IFxuICAgIHJvdGF0aW9uOiBbLU1hdGguUEkgLyAyLCAwLCAwXSwgXG4gICAgcG9zaXRpb246IFswLCAwLCAwXVxuICB9KSk7XG4gIHJldHVybiAoXG4gICAgPG1lc2ggcmVmPXtyZWZ9IHJlY2VpdmVTaGFkb3c+XG4gICAgICA8cGxhbmVHZW9tZXRyeSBhcmdzPXtbMTAwMCwgMTAwMF19IC8+XG4gICAgICA8bWVzaFN0YW5kYXJkTWF0ZXJpYWwgY29sb3I9XCIjMGEwYTFhXCIgLz5cbiAgICA8L21lc2g+XG4gICk7XG59O1xuXG4vLyA1LiBPYnN0YWNsZXMgKEJ1aWxkaW5nIGJsb2NrcyBmb3IgYSBzaW1wbGUgdHJhY2spXG5jb25zdCBPYnN0YWNsZSA9ICh7IHBvc2l0aW9uLCBjb2xvciwgYXJncyA9IFsyLCAyLCAyXSB9KSA9PiB7XG4gIGNvbnN0IFtyZWZdID0gdXNlQm94KCgpID0+ICh7IHR5cGU6ICdTdGF0aWMnLCBwb3NpdGlvbiwgYXJncyB9KSk7XG4gIHJldHVybiAoXG4gICAgPG1lc2ggcmVmPXtyZWZ9IGNhc3RTaGFkb3cgcmVjZWl2ZVNoYWRvdz5cbiAgICAgIDxib3hHZW9tZXRyeSBhcmdzPXthcmdzfSAvPlxuICAgICAgPG1lc2hTdGFuZGFyZE1hdGVyaWFsIGNvbG9yPXtjb2xvcn0gZW1pc3NpdmU9e2NvbG9yfSBlbWlzc2l2ZUludGVuc2l0eT17MC40fSAvPlxuICAgICAgey8qIEFkZCBhIHdpcmVmcmFtZSBvdmVyIGl0IGZvciBjb29sIG5lb24gbG9vayAqL31cbiAgICAgIDxtZXNoPlxuICAgICAgICA8Ym94R2VvbWV0cnkgYXJncz17W2FyZ3NbMF0rMC4wMSwgYXJnc1sxXSswLjAxLCBhcmdzWzJdKzAuMDFdfSAvPlxuICAgICAgICA8bWVzaEJhc2ljTWF0ZXJpYWwgY29sb3I9XCIjZmZmZmZmXCIgd2lyZWZyYW1lIC8+XG4gICAgICA8L21lc2g+XG4gICAgPC9tZXNoPlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXBwKCkge1xuICByZXR1cm4gKFxuICAgIDxkaXYgc3R5bGU9e3sgd2lkdGg6ICcxMDB2dycsIGhlaWdodDogJzEwMHZoJywgYmFja2dyb3VuZDogJyMwMjAyMDUnLCBtYXJnaW46IDAsIHBhZGRpbmc6IDAsIG92ZXJmbG93OiAnaGlkZGVuJyB9fT5cbiAgICAgIDxDYW52YXMgc2hhZG93cyBjYW1lcmE9e3sgcG9zaXRpb246IFswLCA1LCAxMF0sIGZvdjogNjAgfX0+XG4gICAgICAgIHsvKiBEYXJrIGxpZ2h0aW5nIGZvciBuZW9uIHZpYmUgKi99XG4gICAgICAgIDxhbWJpZW50TGlnaHQgaW50ZW5zaXR5PXswLjF9IC8+XG4gICAgICAgIDxkaXJlY3Rpb25hbExpZ2h0IHBvc2l0aW9uPXtbMTAsIDIwLCAxMF19IGludGVuc2l0eT17MX0gY2FzdFNoYWRvdyAvPlxuICAgICAgICA8cG9pbnRMaWdodCBwb3NpdGlvbj17WzAsIDEwLCAwXX0gaW50ZW5zaXR5PXs1fSBjb2xvcj1cIiNmZjAwZmZcIiBkaXN0YW5jZT17NTB9IC8+XG4gICAgICAgIFxuICAgICAgICB7LyogTmVvbiBHcmlkIGVmZmVjdCBmb3IgdGhlIGZsb29yICovfVxuICAgICAgICA8Z3JpZEhlbHBlciBhcmdzPXtbMTAwMCwgMTAwLCAnI2ZmMDBhYScsICcjMTExMTMzJ119IHBvc2l0aW9uPXtbMCwgMC4wMSwgMF19IC8+XG5cbiAgICAgICAgey8qIFRy4buNbmcgbOG7sWMgY2h14bqpbiBHMTA6IC0zLjI1LiBNYSBzw6F0IHRvw6BuIGPhu6VjID0gMCDEkeG7gyBraHVuZyB4ZSB0csaw4bujdCB0csOqbiBt4bq3dCDEkeG6pXQga2jDtG5nIGLhu4sgbOG6rXQgKi99XG4gICAgICAgIDxQaHlzaWNzIGdyYXZpdHk9e1swLCAtMy4yNSwgMF19IGRlZmF1bHRDb250YWN0TWF0ZXJpYWw9e3sgZnJpY3Rpb246IDAsIHJlc3RpdHV0aW9uOiAwLjIgfX0+XG4gICAgICAgICAgPENhciAvPlxuICAgICAgICAgIDxHcm91bmQgLz5cbiAgICAgICAgICBcbiAgICAgICAgICB7LyogU2ltcGxlIFRyYWNrIGxheW91dCB3aXRoIG9ic3RhY2xlcyAqL31cbiAgICAgICAgICA8T2JzdGFjbGUgcG9zaXRpb249e1sxMCwgMiwgLTIwXX0gY29sb3I9XCIjZmYwMGFhXCIgYXJncz17WzQsIDQsIDRdfSAvPlxuICAgICAgICAgIDxPYnN0YWNsZSBwb3NpdGlvbj17Wy0xMCwgMiwgLTQwXX0gY29sb3I9XCIjMDBmZmZmXCIgYXJncz17WzQsIDQsIDRdfSAvPlxuICAgICAgICAgIDxPYnN0YWNsZSBwb3NpdGlvbj17WzUsIDEuNSwgLTYwXX0gY29sb3I9XCIjZmZmZjAwXCIgYXJncz17WzE1LCAzLCAzXX0gLz5cbiAgICAgICAgICA8T2JzdGFjbGUgcG9zaXRpb249e1stMTUsIDIsIC04MF19IGNvbG9yPVwiI2ZmMDBhYVwiIGFyZ3M9e1s0LCA0LCA0XX0gLz5cbiAgICAgICAgICA8T2JzdGFjbGUgcG9zaXRpb249e1syMCwgMiwgLTEwMF19IGNvbG9yPVwiIzAwZmZmZlwiIGFyZ3M9e1s0LCA0LCA0XX0gLz5cbiAgICAgICAgICA8T2JzdGFjbGUgcG9zaXRpb249e1swLCAxLjUsIC0xMjBdfSBjb2xvcj1cIiNmZjAwYWFcIiBhcmdzPXtbMTAsIDMsIDNdfSAvPlxuICAgICAgICA8L1BoeXNpY3M+XG4gICAgICA8L0NhbnZhcz5cbiAgICAgIFxuICAgICAgey8qIFNpbXBsZSBVSSBPdmVybGF5ICovfVxuICAgICAgPGRpdiBzdHlsZT17e1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJywgdG9wOiAzMCwgbGVmdDogMzAsIGNvbG9yOiAnd2hpdGUnLCBcbiAgICAgICAgZm9udEZhbWlseTogJ1wiU2Vnb2UgVUlcIiwgVGFob21hLCBHZW5ldmEsIFZlcmRhbmEsIHNhbnMtc2VyaWYnLCBcbiAgICAgICAgdGV4dFNoYWRvdzogJzAgMCAxMHB4ICNmZjAwYWEnLCBwb2ludGVyRXZlbnRzOiAnbm9uZSdcbiAgICAgIH19PlxuICAgICAgICA8aDEgc3R5bGU9e3sgbWFyZ2luOiAwLCBmb250U2l6ZTogJzJyZW0nIH19Pk5lb24gRHJpZnQgUmFjaW5nPC9oMT5cbiAgICAgICAgPHAgc3R5bGU9e3sgZm9udFNpemU6ICcxLjJyZW0nLCBtYXJnaW5Ub3A6ICcxMHB4JyB9fT5XLCBBLCBTLCBEIC8gQXJyb3dzIC0gRHJpdmU8L3A+XG4gICAgICAgIDxwIHN0eWxlPXt7IGZvbnRTaXplOiAnMS4ycmVtJyB9fT5TcGFjZSAtIEJyYWtlPC9wPlxuICAgICAgICA8cCBzdHlsZT17eyBmb250U2l6ZTogJzEuMnJlbScgfX0+UiAtIFJlc2V0IC8gTOG6rXQgbOG6oWkgeGU8L3A+XG4gICAgICAgIDxwIHN0eWxlPXt7IGZvbnRTaXplOiAnMS4ycmVtJywgY29sb3I6ICcjMDBmZmZmJyB9fT5TY3JvbGwgTW91c2UgLSBab29tIEluL091dDwvcD5cbiAgICAgICAgPHAgc3R5bGU9e3sgZm9udFNpemU6ICcxLjJyZW0nLCBjb2xvcjogJyMwMGZmZmYnIH19Pk1pZGRsZSBDbGljayArIERyYWcgLSBYb2F5IENhbWVyYTwvcD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG51c2VHTFRGLnByZWxvYWQoJy9tb2RlbHMvY2FyL2RlZmF1bHQvY2hhc3Npcy5nbGInKTtcbnVzZUdMVEYucHJlbG9hZCgnL21vZGVscy9jYXIvZGVmYXVsdC93aGVlbC5nbGInKTtcbnVzZUdMVEYucHJlbG9hZCgnL21vZGVscy9jYXIvZGVmYXVsdC9iYWNrTGlnaHRzQnJha2UuZ2xiJyk7XG51c2VHTFRGLnByZWxvYWQoJy9tb2RlbHMvY2FyL2RlZmF1bHQvYmFja0xpZ2h0c1JldmVyc2UuZ2xiJyk7XG51c2VHTFRGLnByZWxvYWQoJy9tb2RlbHMvY2FyL2RlZmF1bHQvYW50ZW5hLmdsYicpO1xuIl19