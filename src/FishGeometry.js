import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Shared fish geometry builder
 */
class FishGeometry {
    static finGeometry = this._createFinGeometry();

    static finGroupGeometry = (() => {
        const dorsalFinGeo = this.finGeometry.clone()
            .rotateZ(-Math.PI / 6)
            .rotateY(Math.PI)
            .translate(-0.5, 0.7, 0)

        const bellyFinLeftGeo = this.finGeometry.clone()
            .rotateX(-Math.PI / 6)
            .translate(-1.2, -1, 0.6)

        const bellyFinRightGeo = this.finGeometry.clone()
            .rotateX(Math.PI / 6)
            .translate(-1.2, -1, -0.6)

        return BufferGeometryUtils.mergeBufferGeometries([dorsalFinGeo, bellyFinLeftGeo, bellyFinRightGeo]);
    })();

    static geometry = [
        this._createBodyGeometry(10), // this.numBones * 2, assuming this.numBones = 5
        this._createBodyGeometry(),
        this._createSimpleGeometry(),
    ];

    /**
     * Creates the complete fish body geometry with segments for smooth animation
     * @param {number} segments - number of segments along the body (default 8)
     * @returns {THREE.BufferGeometry}
     */
    static _createBodyGeometry(segments = 4) {
        const vertices = [];
        const indices = [];

        const headTip = [1, 0, 0];              // 0: front tip (nose)
        const headTopFront = [0.5, 0.6, 0];     // 1: top front
        const headTop = [0, 0.8, 0];            // 2: top center
        const headBottomFront = [0.5, -0.6, 0]; // 3: bottom front
        const headBottom = [0, -0.8, 0];        // 4: bottom center
        const headLeftFront = [0.5, 0, 0.4];    // 5: left front
        const headLeft = [0, 0, 0.5];           // 6: left center
        const headRightFront = [0.5, 0, -0.4];  // 7: right front
        const headRight = [0, 0, -0.5];         // 8: right center

        vertices.push(
            ...headTip,         // 0
            ...headTopFront,    // 1
            ...headTop,         // 2
            ...headBottomFront, // 3
            ...headBottom,      // 4
            ...headLeftFront,   // 5
            ...headLeft,        // 6
            ...headRightFront,  // 7
            ...headRight        // 8
        );

        // Top surface
        indices.push(0, 1, 5);  // tip to top-front to left-front
        indices.push(0, 7, 1);  // tip to right-front to top-front
        indices.push(1, 2, 5);  // top-front to top to left-front
        indices.push(1, 7, 2);  // top-front to right-front to top
        indices.push(2, 6, 5);  // top to left to left-front
        indices.push(2, 7, 8);  // top to right-front to right
        
        // Bottom surface
        indices.push(0, 5, 3);  // tip to left-front to bottom-front
        indices.push(0, 3, 7);  // tip to bottom-front to right-front
        indices.push(3, 5, 4);  // bottom-front to left-front to bottom
        indices.push(3, 4, 7);  // bottom-front to bottom to right-front
        indices.push(4, 5, 6);  // bottom to left-front to left
        indices.push(4, 8, 7);  // bottom to right to right-front
        
        // BODY SEGMENTS
        const bodyStart = 0;
        const bodyEnd = -3;
        const bodyLength = bodyEnd - bodyStart;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = bodyStart + bodyLength * t;
            
            // Taper the body from front to back
            const thickness = 0.8 * (1 - t * 0.6);
            const width = 0.5 * (1 - t * 0.6);
            
            const baseIndex = vertices.length / 3;
            
            // Cross-section with 4 vertices (top, bottom, left, right)
            vertices.push(
                x, thickness, 0,      // top
                x, -thickness, 0,     // bottom
                x, 0, width,          // left
                x, 0, -width          // right
            );
            
            if (i > 0) {
                const prevIndex = baseIndex - 4;
                
                // Connect segments with quads (2 triangles each)
                // Top face
                indices.push(prevIndex, baseIndex, prevIndex + 2);
                indices.push(baseIndex, baseIndex + 2, prevIndex + 2);
                
                // Top right face
                indices.push(prevIndex, prevIndex + 3, baseIndex);
                indices.push(baseIndex, prevIndex + 3, baseIndex + 3);

                // Bottom right face
                indices.push(prevIndex + 3, prevIndex + 1, baseIndex + 1);
                indices.push(prevIndex + 3, baseIndex + 1, baseIndex + 3);
                
                // Bottom left face
                indices.push(prevIndex + 2, baseIndex + 2, prevIndex + 1);
                indices.push(baseIndex + 2, baseIndex + 1, prevIndex + 1);
            }
        }

        // TAIL
        const tailRootIndex = vertices.length / 3;

        // Add tail base vertices
        vertices.push(
            -3, 0.3, 0,     // tail base top
            -3, -0.3, 0,    // tail base bottom
            -3, 0, 0.2,     // tail base left
            -3, 0, -0.2     // tail base right
        );

        // Add tail fin vertices
        vertices.push(
            -4, 1.25, 0,    // tail top tip
            -4, -1.25, 0,   // tail bottom tip
            -3.5, 0, 0      // tail center tip
        );

        const tailBaseTop = tailRootIndex;
        const tailBaseBottom = tailRootIndex + 1;
        const tailBaseLeft = tailRootIndex + 2;
        const tailBaseRight = tailRootIndex + 3;
        const tailTopTip = tailRootIndex + 4;
        const tailBottomTip = tailRootIndex + 5;
        const tailCenterTip = tailRootIndex + 6;

        // Top fin section
        indices.push(tailBaseTop, tailTopTip, tailBaseLeft);
        indices.push(tailTopTip, tailCenterTip, tailBaseLeft);
        indices.push(tailBaseTop, tailBaseRight, tailTopTip);
        indices.push(tailBaseRight, tailCenterTip, tailTopTip);

        // Bottom fin section
        indices.push(tailBaseBottom, tailBaseLeft, tailBottomTip);
        indices.push(tailBaseLeft, tailCenterTip, tailBottomTip);
        indices.push(tailBaseBottom, tailBottomTip, tailBaseRight);
        indices.push(tailBottomTip, tailCenterTip, tailBaseRight);

        const verticesArray = new Float32Array(vertices);

        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(verticesArray, 3));
        
        // Calculate and set UV coordinates
        const minX = -4, maxX = 1, minY = -1.25, maxY = 1.25;
        const lenX = maxX - minX, lenY = maxY - minY;
        const uvArray = new Float32Array((verticesArray.length / 3) * 2);
        for (let i = 0, j = 0; i < verticesArray.length; i += 3, j += 2) {
            const x = verticesArray[i], y = verticesArray[i + 1];
            let u = (x - minX) / lenX;
            let v = (y - minY) / lenY;
            u = Math.max(0, Math.min(1, u));
            v = Math.max(0, Math.min(1, v));
            uvArray[j] = u;
            uvArray[j + 1] = v;
        }
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Creates a simple low-detail fish geometry
     * @returns {THREE.BufferGeometry}
     */
    static _createSimpleGeometry() {
        const vertices = new Float32Array([
            -4, 0, 0, 
            1, 1, 0, 
            1, -1, 0
        ]);
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex([0, 1, 2]);
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0,0,1,0,0,1], 2));
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Creates fin geometry
     * @param {number} finSize
     * @returns {THREE.BufferGeometry}
     */
    static _createFinGeometry(finSize = 0.8) {
        const vertices = new Float32Array([
            0, 0, 0, 
            finSize, 0, 0, 
            finSize, finSize, 0
        ]);
        
        const geometry = new THREE.BufferGeometry();
        geometry.setIndex([
            0, 1, 2,
            2, 1, 0,
        ]);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0,0,1,0,0,1], 2));
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Retrieves a cached material or creates a new one.
     * @param {THREE.Color | number | string} color
     * @param {string | null} texturePath
     * @returns {THREE.Material}
     */
    static getSharedMaterial(color, texturePath = null) {
        const matKey = texturePath ? `tex:${texturePath}|col:${String(color)}` : `col:${String(color)}`;
        
        FishGeometry._sharedMaterials = FishGeometry._sharedMaterials || new Map();
        FishGeometry._textureLoader = FishGeometry._textureLoader || new THREE.TextureLoader();
        FishGeometry._textureCache = FishGeometry._textureCache || new Map();

        let material = FishGeometry._sharedMaterials.get(matKey);
        if (!material) {
            if (texturePath) {
                let tex = FishGeometry._textureCache.get(texturePath);
                if (!tex) {
                    tex = FishGeometry._textureLoader.load(texturePath);
                    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                    FishGeometry._textureCache.set(texturePath, tex);
                }
                material = new THREE.MeshPhongMaterial({ map: tex, color: color });
            } else {
                material = new THREE.MeshPhongMaterial({ color: color });
            }
            FishGeometry._sharedMaterials.set(matKey, material);
        }
        return material;
    }
}

export { FishGeometry };
