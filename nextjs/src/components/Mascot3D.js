import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const REACTION_ANIMS = {
  cheer: ["Yes"],
  excited: ["Excited", "Jump"],
  happy: ["Idle"],
  tantrum: ["No", "HitReact"],
};

const ANIMATION_FILES = {
  Yes: ["/Head%20Nod%20Yes.fbx", "/Head Nod Yes.fbx"],
  No: ["/No.fbx"],
  HitReact: ["/Hit%20Reaction.fbx", "/Hit Reaction.fbx"],
  Jump: ["/Jumping.fbx"],
  Excited: ["/Hip%20Hop%20Dancing.fbx", "/Hip Hop Dancing.fbx"],
};

const normalizeName = (value) => value.toLowerCase().replace(/[^a-z]/g, "");

const findAnimation = (actions, names) => {
  for (const name of names) {
    if (actions[name]) return actions[name];
  }
  const normalized = Object.keys(actions).reduce((acc, key) => {
    acc[normalizeName(key)] = actions[key];
    return acc;
  }, {});
  for (const name of names) {
    const match = normalized[normalizeName(name)];
    if (match) return match;
  }
  return actions.Idle || actions.idle || Object.values(actions)[0] || null;
};

export default function Mascot3D({ reaction }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const mixerRef = useRef(null);
  const actionsRef = useRef({});
  const currentActionRef = useRef(null);
  const lastReactionRef = useRef(null);
  const animationRef = useRef(null);
  const finishedHandlerRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(240, 240);
    mountRef.current.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(4, 6, 5);
    scene.add(key);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    const placeholderGeometry = new THREE.ConeGeometry(0.6, 1.4, 12);
    const placeholderMaterial = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholder.position.set(0, 0.2, 0);
    scene.add(placeholder);

    const loader = new FBXLoader();
    const loadModel = (url, fallbackUrl) =>
      new Promise((resolve, reject) => {
        loader.load(
          url,
          resolve,
          undefined,
          (err) => {
            if (fallbackUrl) {
              loader.load(fallbackUrl, resolve, undefined, reject);
            } else {
              reject(err);
            }
          }
        );
      });

    loadModel("/mascot", "/Ch14_nonPBR.fbx")
      .then((model) => {
        scene.remove(placeholder);
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const targetHeight = 2.0;
        const scale = size.y > 0 ? targetHeight / size.y : 1;
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        model.updateMatrixWorld(true);

        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledSize = new THREE.Vector3();
        scaledBox.getSize(scaledSize);
        const maxDim = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);
        const fov = (camera.fov * Math.PI) / 180;
        const dist = (maxDim / 2) / Math.tan(fov / 2);
        camera.position.set(0, 0, dist * 1.4);
        camera.near = dist / 10;
        camera.far = dist * 10;
        camera.updateProjectionMatrix();
        model.traverse((child) => {
          if (child.isSkinnedMesh) {
            child.frustumCulled = false;
          }
        });
        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;
        actionsRef.current = {};

        const loadAnimation = (name, urls, index = 0) =>
          new Promise((resolve) => {
            const url = urls[index];
            if (!url) return resolve();
            loader.load(
              url,
              (anim) => {
                const clip = anim.animations[0];
                if (clip) {
                  clip.name = name;
                  const action = mixer.clipAction(clip, model);
                  action.loop = THREE.LoopRepeat;
                  actionsRef.current[name] = action;
                }
                resolve();
              },
              undefined,
              () => resolve(loadAnimation(name, urls, index + 1))
            );
          });

        Promise.all(
          Object.entries(ANIMATION_FILES).map(([name, urls]) => loadAnimation(name, urls))
        ).then(() => {
          const idle = findAnimation(actionsRef.current, ["Idle", "Excited", "Yes", "No"]);
          if (idle) {
            idle.enabled = true;
            idle.setEffectiveWeight(1);
            idle.setEffectiveTimeScale(1);
            idle.reset().fadeIn(0.2).play();
            currentActionRef.current = idle;
          } else {
            const first = Object.values(actionsRef.current)[0];
            if (first) {
              first.enabled = true;
              first.setEffectiveWeight(1);
              first.setEffectiveTimeScale(1);
              first.reset().fadeIn(0.2).play();
              currentActionRef.current = first;
            }
          }
          setStatus("ready");
        });
      })
      .catch((error) => {
        console.error("Failed to load mascot model", error);
        setStatus("error");
      });

    const clock = new THREE.Clock();
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      if (mixerRef.current) {
        mixerRef.current.update(clock.getDelta());
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;
      const size = Math.min(mountRef.current.clientWidth || 200, 280);
      rendererRef.current.setSize(size, size);
      cameraRef.current.aspect = 1;
      cameraRef.current.updateProjectionMatrix();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      if (mixerRef.current && finishedHandlerRef.current) {
        mixerRef.current.removeEventListener("finished", finishedHandlerRef.current);
      }
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && mountRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!reaction) return;
    if (lastReactionRef.current === reaction.key) return;
    lastReactionRef.current = reaction.key;

    const actions = actionsRef.current;
    const mixer = mixerRef.current;
    if (!actions || !mixer) return;

    const next = findAnimation(actions, REACTION_ANIMS[reaction.mood] || ["Idle"]);
    if (!next) return;

    if (currentActionRef.current && currentActionRef.current !== next) {
      currentActionRef.current.fadeOut(0.15);
    }

    const isIdle = next === findAnimation(actions, ["Idle"]);
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);
    next.reset();
    next.loop = isIdle ? THREE.LoopRepeat : THREE.LoopOnce;
    next.clampWhenFinished = !isIdle;
    next.fadeIn(0.15).play();
    currentActionRef.current = next;

    if (!isIdle) {
      if (finishedHandlerRef.current) {
        mixer.removeEventListener("finished", finishedHandlerRef.current);
      }
      finishedHandlerRef.current = (event) => {
        if (event.action !== next) return;
        const idle = findAnimation(actions, ["Idle", "Excited", "Yes"]);
        if (idle) {
          idle.enabled = true;
          idle.setEffectiveWeight(1);
          idle.setEffectiveTimeScale(1);
          idle.reset().fadeIn(0.2).play();
          currentActionRef.current = idle;
        }
      };
      mixer.addEventListener("finished", finishedHandlerRef.current);
    }
  }, [reaction]);

  return (
    <div ref={mountRef} className="mascot-canvas" aria-hidden="true">
      {status !== "ready" && (
        <div className="mascot-status">
          {status === "loading" ? "Loading mascot..." : "Mascot failed to load"}
        </div>
      )}
    </div>
  );
}
