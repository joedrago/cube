// --------------------------------------------------------------------------------------
// Constants

window.ROTATE_SPEED = 5
window.FAST_ROTATE_SPEED = 30

window.ACTION_ROT = 1
window.ACTION_LOOK = 2
window.ACTION_TILT = 3
window.ACTION_MOVE = 4

window.FACE_U = 0
window.FACE_D = 1
window.FACE_L = 2
window.FACE_R = 3
window.FACE_B = 4
window.FACE_F = 5

window.ROT_U = 0
window.ROT_D = 1
window.ROT_L = 2
window.ROT_R = 3
window.ROT_B = 4
window.ROT_F = 5
window.ROT_X = 6
window.ROT_Y = 7
window.ROT_Z = 8

window.MOVE_SWAP_FB_CORNERS = 0
window.MOVE_SPIN_3_CORNERS = 1
window.MOVE_RUBE_MOVE = 2

window.CUBE_POS_Z = 6

window.NINETY_DEGREES = Math.PI / 2

window.VIEW_TILT_ANGLE = 35
window.SPIN_SPEED = 4

window.TILT_TL = 0
window.TILT_TR = 1
window.TILT_BL = 2
window.TILT_BR = 3
window.TILT_UD = 4

const FACE_COLORS = [
    [1.0, 1.0, 0.0],
    [1.0, 1.0, 1.0],
    [0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0],
    [1.0, 0.5, 0.0],
    [1.0, 0.0, 0.0]
]

const OPPOSITE_SIDE = [FACE_D, FACE_U, FACE_R, FACE_L, FACE_F, FACE_B]

const SPIN_INDICES = [
    [FACE_F, 0, 1, 2, FACE_L, 0, 1, 2, FACE_B, 0, 1, 2, FACE_R, 0, 1, 2], // ROT_U
    [FACE_F, 6, 7, 8, FACE_R, 6, 7, 8, FACE_B, 6, 7, 8, FACE_L, 6, 7, 8], // ROT_D
    [FACE_U, 0, 3, 6, FACE_F, 0, 3, 6, FACE_D, 0, 3, 6, FACE_B, 8, 5, 2], // ROT_L
    [FACE_U, 8, 5, 2, FACE_B, 0, 3, 6, FACE_D, 8, 5, 2, FACE_F, 8, 5, 2], // ROT_R
    [FACE_U, 2, 1, 0, FACE_L, 0, 3, 6, FACE_D, 6, 7, 8, FACE_R, 8, 5, 2], // ROT_B
    [FACE_U, 6, 7, 8, FACE_R, 0, 3, 6, FACE_D, 2, 1, 0, FACE_L, 8, 5, 2], // ROT_F

    [FACE_U, 7, 4, 1, FACE_B, 1, 4, 7, FACE_D, 7, 4, 1, FACE_F, 7, 4, 1], // ROT_X
    [FACE_F, 3, 4, 5, FACE_L, 3, 4, 5, FACE_B, 3, 4, 5, FACE_R, 3, 4, 5], // ROT_Y
    [FACE_U, 3, 4, 5, FACE_R, 1, 4, 7, FACE_D, 5, 4, 3, FACE_L, 7, 4, 1] // ROT_Z
]

// --------------------------------------------------------------------------------------
// Image Caching

const preloadedImages = [
    "cubie",

    "rd",
    "ld",
    "l",
    "r",
    "u",
    "d",

    "grayrd",
    "grayld",
    "grayl",
    "grayr",
    "grayu",
    "grayd",

    "grayctl",
    "grayctr",
    "graycbl",
    "graycbr",

    "move0",
    "move1",
    "move2"
]

const imageCache = {}
async function preloadImage(name) {
    return new Promise((resolve) => {
        const url = `images/${name}.png`
        const img = new Image()
        img.onload = function () {
            console.log(`Image Loaded: ${name}`)
            resolve(true)
        }
        img.src = url
        imageCache[name] = img
    })
}

async function preloadImages() {
    const preloadPromises = []
    for (let preloadUrl of preloadedImages) {
        preloadPromises.push(preloadImage(preloadUrl))
    }
    console.log("Loading images...")
    await Promise.all(preloadPromises)
    console.log("All images loaded.")
    return true
}

// --------------------------------------------------------------------------------------
// Math helpers

function d2r(deg) {
    return (deg * Math.PI) / 180
}

function lerp(curr, req, speed) {
    if (curr == req) {
        return curr
    }

    let dir = req - curr > 0 ? 1 : -1
    for (let i = 0; i < speed; ++i) {
        curr += dir
        if (curr == req) {
            return curr
        }
    }
    return curr
}

// --------------------------------------------------------------------------------------
// Render helpers

let kicked_ = false

function render(now) {
    console.log("render")

    kicked_ = false
    if (window.cube.draw()) {
        kick()
    }
}

function kick() {
    if (!kicked_) {
        kicked_ = true
        requestAnimationFrame(render)
    }
}

// --------------------------------------------------------------------------------------
// Cube

class Cube {
    constructor(elementName) {
        this.elementName = elementName
        this.rotateSpeed = ROTATE_SPEED
        this.textures = {}
        this.actions = []

        this.spinReqX = this.spinX = VIEW_TILT_ANGLE
        this.spinReqY = this.spinY = -VIEW_TILT_ANGLE
        this.spinReqZ = this.spinZ = 0

        this.unshuffle()
    }

    unshuffle() {
        this.rots = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        this.cubies = []
        for (var face = 0; face < 6; ++face) {
            this.cubies.push([])
            for (var cubie = 0; cubie < 9; ++cubie) {
                this.cubies[face].push(face)
            }
        }
        kick()
    }

    shuffle() {
        this.unshuffle()

        for (var i = 0; i < 40; ++i) {
            const randomRot = Math.floor(Math.random() * 9)
            const randomCW = Math.floor(Math.random() * 2) > 1
            this.queue(ACTION_ROT, randomRot, randomCW)
        }

        this.rotateSpeed = FAST_ROTATE_SPEED
        kick()
    }

    queue(action, rot, clockwise) {
        this.actions.push({
            action,
            rot,
            clockwise
        })
    }

    loadShader(type, source) {
        const typeName = type == this.gl.VERTEX_SHADER ? "vertex" : "fragment"
        const shader = this.gl.createShader(type)
        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(`An error occurred compiling ${typeName} shader: ${this.gl.getShaderInfoLog(shader)}`)
            this.gl.deleteShader(shader)
            return null
        }
        return shader
    }

    redBox() {
        this.gl.clearColor(1.0, 0.0, 0.0, 1.0)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
        return false
    }

    getTexture(name) {
        if (!this.textures[name]) {
            this.textures[name] = this.gl.createTexture()
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[name])
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1)
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, imageCache[name])
        }
        return this.textures[name]
    }

    initGL() {
        const canvas = document.querySelector(this.elementName)
        this.gl = canvas.getContext("webgl")
        if (!this.gl) {
            alert("No WebGL?")
            return false
        }

        this.gl.clearColor(0.3, 0.3, 0.3, 1.0)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)

        const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;

        uniform mat4 uMVPMatrix;

        varying lowp vec2 vTextureCoord;

        void main(void) {
          gl_Position = uMVPMatrix * aVertexPosition;
          vTextureCoord = aTextureCoord;
        }
      `
        const fsSource = `
        uniform sampler2D sTexture;
        uniform lowp vec4 uColor;

        varying lowp vec2 vTextureCoord;

        void main(void) {
          gl_FragColor = texture2D(sTexture, vTextureCoord) * uColor;
        }
      `

        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource)
        if (!vertexShader) {
            return this.redBox()
        }
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource)
        if (!fragmentShader) {
            return this.redBox()
        }

        this.program = this.gl.createProgram()
        this.gl.attachShader(this.program, vertexShader)
        this.gl.attachShader(this.program, fragmentShader)
        this.gl.linkProgram(this.program)

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error(`Unable to link shader program: ${gl.getProgramInfoLog(this.program)}`)
            return this.redBox()
        }

        this.attribs = {
            vertexPosition: this.gl.getAttribLocation(this.program, "aVertexPosition"),
            vertexTextureCoord: this.gl.getAttribLocation(this.program, "aTextureCoord")
        }
        this.uniforms = {
            mvpMatrix: this.gl.getUniformLocation(this.program, "uMVPMatrix"),
            // modelViewMatrix: this.gl.getUniformLocation(this.program, "uModelViewMatrix"),
            color: this.gl.getUniformLocation(this.program, "uColor")
        }

        console.log(this.attribs)
        console.log(this.uniforms)

        this.posBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer)
        const positions = [-1.5, -1.5, -1.5, -0.5, -1.5, -1.5, -0.5, -0.5, -1.5, -1.5, -0.5, -1.5]
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW)

        this.textureCoordBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer)
        const texCoords = [0, 0, 1, 0, 1, 1, 0, 1]
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.STATIC_DRAW)

        this.indexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        const indices = [0, 1, 2, 2, 3, 0]
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW)
        return true
    }

    drawCubieFace(xrot, yrot, zrot, face, tx, ty, color) {
        const projectionMatrix = mat4.create()
        const EXTENTS = 0.65
        mat4.frustum(projectionMatrix, -EXTENTS, EXTENTS, EXTENTS, -EXTENTS, 1, 20)

        const viewMatrix = mat4.create()
        mat4.lookAt(viewMatrix, [0, 0, 1], [0, 0, 5], [0, 1, 0])

        const modelMatrix = mat4.create()
        mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, CUBE_POS_Z])

        // // Overall cube rotation
        mat4.rotate(modelMatrix, modelMatrix, d2r(this.spinX), [1, 0, 0])
        mat4.rotate(modelMatrix, modelMatrix, d2r(this.spinY), [0, 1, 0])
        mat4.rotate(modelMatrix, modelMatrix, d2r(this.spinZ), [0, 0, 1])

        mat4.rotate(modelMatrix, modelMatrix, d2r(xrot), [1, 0, 0])
        mat4.rotate(modelMatrix, modelMatrix, d2r(yrot), [0, 1, 0])
        mat4.rotate(modelMatrix, modelMatrix, d2r(zrot), [0, 0, 1])

        switch (face) {
            case FACE_U:
                mat4.rotate(modelMatrix, modelMatrix, -NINETY_DEGREES, [1.0, 0.0, 0.0])
                break
            case FACE_D:
                mat4.rotate(modelMatrix, modelMatrix, NINETY_DEGREES, [1.0, 0.0, 0.0])
                break
            case FACE_L:
                mat4.rotate(modelMatrix, modelMatrix, -NINETY_DEGREES, [0.0, 1.0, 0.0])
                break
            case FACE_R:
                mat4.rotate(modelMatrix, modelMatrix, NINETY_DEGREES, [0.0, 1.0, 0.0])
                break
            case FACE_B:
                mat4.rotate(modelMatrix, modelMatrix, -NINETY_DEGREES * 2, [1.0, 0.0, 0.0])
                break
            case FACE_F:
                break
        }

        mat4.translate(modelMatrix, modelMatrix, [tx, ty, 0])

        const mvpMatrix = mat4.create()
        mat4.multiply(mvpMatrix, viewMatrix, modelMatrix)
        mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix)

        this.gl.uniformMatrix4fv(this.uniforms.mvpMatrix, false, mvpMatrix)
        this.gl.uniform4f(this.uniforms.color, FACE_COLORS[color][0], FACE_COLORS[color][1], FACE_COLORS[color][2], 1.0)
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0)
    }

    rotateFace(face) {
        let t = this.cubies[face][0]
        this.cubies[face][0] = this.cubies[face][6]
        this.cubies[face][6] = this.cubies[face][8]
        this.cubies[face][8] = this.cubies[face][2]
        this.cubies[face][2] = t

        t = this.cubies[face][1]
        this.cubies[face][1] = this.cubies[face][3]
        this.cubies[face][3] = this.cubies[face][7]
        this.cubies[face][7] = this.cubies[face][5]
        this.cubies[face][5] = t
    }

    spin(indices) {
        const stripe = [0, 0, 0]
        const face0 = indices[0]
        const face1 = indices[4]
        const face2 = indices[8]
        const face3 = indices[12]

        stripe[0] = this.cubies[face3][indices[13]]
        stripe[1] = this.cubies[face3][indices[14]]
        stripe[2] = this.cubies[face3][indices[15]]

        this.cubies[face3][indices[13]] = this.cubies[face2][indices[9]]
        this.cubies[face3][indices[14]] = this.cubies[face2][indices[10]]
        this.cubies[face3][indices[15]] = this.cubies[face2][indices[11]]

        this.cubies[face2][indices[9]] = this.cubies[face1][indices[5]]
        this.cubies[face2][indices[10]] = this.cubies[face1][indices[6]]
        this.cubies[face2][indices[11]] = this.cubies[face1][indices[7]]

        this.cubies[face1][indices[5]] = this.cubies[face0][indices[1]]
        this.cubies[face1][indices[6]] = this.cubies[face0][indices[2]]
        this.cubies[face1][indices[7]] = this.cubies[face0][indices[3]]

        this.cubies[face0][indices[1]] = stripe[0]
        this.cubies[face0][indices[2]] = stripe[1]
        this.cubies[face0][indices[3]] = stripe[2]
    }

    move(rot, clockwise) {
        let numRotations = 1
        if (!clockwise) {
            numRotations = 3
        }

        for (var i = 0; i < numRotations; ++i) {
            if (rot < 6) {
                this.rotateFace(rot)
            }
            this.spin(SPIN_INDICES[rot])
        }

        this.rots[rot] = -90
        if (clockwise) {
            this.rots[rot] *= -1
        }

        kick()
    }

    act(action, dir, clockwise) {
        if (action == ACTION_MOVE) {
            switch (dir) {
                case MOVE_SWAP_FB_CORNERS:
                    this.queue(ACTION_ROT, ROT_U, false)
                    this.queue(ACTION_ROT, ROT_F, true)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_L, false)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_L, true)
                    this.queue(ACTION_ROT, ROT_U, false)

                    this.queue(ACTION_ROT, ROT_F, true)
                    this.queue(ACTION_ROT, ROT_F, true)
                    break
                case MOVE_SPIN_3_CORNERS:
                    this.queue(ACTION_ROT, ROT_U, false)
                    this.queue(ACTION_ROT, ROT_F, true)
                    this.queue(ACTION_ROT, ROT_F, true)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_F, true)
                    this.queue(ACTION_ROT, ROT_U, false)
                    this.queue(ACTION_ROT, ROT_F, true)
                    this.queue(ACTION_ROT, ROT_U, true)

                    this.queue(ACTION_ROT, ROT_F, true)
                    this.queue(ACTION_ROT, ROT_F, true)
                    break
                case MOVE_RUBE_MOVE:
                    this.queue(ACTION_ROT, ROT_X, false)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_X, false)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_X, false)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_U, true)

                    this.queue(ACTION_ROT, ROT_X, true)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_X, true)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_X, true)
                    this.queue(ACTION_ROT, ROT_U, true)
                    this.queue(ACTION_ROT, ROT_U, true)
                    break
            }
        } else if (action == ACTION_TILT) {
            switch (dir) {
                case TILT_TL:
                    this.spinReqX = VIEW_TILT_ANGLE
                    this.spinReqY = VIEW_TILT_ANGLE
                    break
                case TILT_TR:
                    this.spinReqX = VIEW_TILT_ANGLE
                    this.spinReqY = -VIEW_TILT_ANGLE
                    break
                case TILT_BL:
                    this.spinReqX = -VIEW_TILT_ANGLE
                    this.spinReqY = VIEW_TILT_ANGLE
                    break
                case TILT_BR:
                    this.spinReqX = -VIEW_TILT_ANGLE
                    this.spinReqY = -VIEW_TILT_ANGLE
                    break
                case TILT_UD:
                    this.spinReqX = -this.spinReqX
                    break
            }
        } else {
            this.queue(action, dir, clockwise)
        }

        kick()
    }

    faceMatches(faceIndex, cornersOnly) {
        const faceColor = this.cubies[faceIndex][0]
        if (cornersOnly) {
            for (let cubie = 2; cubie <= 8; cubie += 2) {
                if (this.cubies[faceIndex][cubie] != faceColor) {
                    return false
                }
            }
        } else {
            for (let cubie = 1; cubie <= 8; ++cubie) {
                if (this.cubies[faceIndex][cubie] != faceColor) {
                    return false
                }
            }
        }
        return true
    }

    sideMatches(faceIndex, cornersOnly) {
        if (!this.faceMatches(faceIndex, cornersOnly)) {
            return false
        }

        const checkIndices = SPIN_INDICES[faceIndex]

        for (let side = 0; side < 4; ++side) {
            const sideIndex = side * 4
            const face = checkIndices[sideIndex]
            const sideColor = this.cubies[face][checkIndices[sideIndex + 1]]
            const cubieStart = cornersOnly ? 3 : 2
            for (let cubie = cubieStart; cubie <= 3; ++cubie) {
                if (this.cubies[face][checkIndices[sideIndex + cubie]] != sideColor) {
                    return false
                }
            }
        }
        return true
    }

    setDescription(desc) {
        document.getElementById("description").innerHTML = desc
    }

    updateDescription() {
        console.log("updateDescription()")
        let sideCount = 0
        let oppositeCornerCount = 0
        let cornerCount = 0
        for (let side = 0; side < 6; ++side) {
            let sideDone = this.sideMatches(side)
            if (sideDone) {
                // console.log(`Side done: ${side}`)
                ++sideCount
                if (this.sideMatches(OPPOSITE_SIDE[side], true)) {
                    ++oppositeCornerCount
                }
            } else {
                let cornersDone = this.sideMatches(side, true)
                if (cornersDone) {
                    // console.log(`Corners done: ${side}`)
                    ++cornerCount
                }
            }
        }
        // console.log(`sideCount ${sideCount} cornerCount ${cornerCount} oppositeCornerCount ${oppositeCornerCount}`)

        let desc = "Shuffled"
        if (sideCount == 6) {
            desc = `<div class="solved">Solved!</div>`
        } else if (sideCount >= 2) {
            desc = `<div class="almost">Top & Bottom</div>`
        } else if (sideCount == 1 && oppositeCornerCount == 0) {
            desc = `<div>Top</div>`
        } else if (sideCount == 1 && oppositeCornerCount == 1) {
            desc = `<div>Top & Corners</div>`
        } else if (sideCount == 0 && cornerCount == 1) {
            desc = `<div>Early Corners</div>`
        } else if (sideCount == 0 && cornerCount >= 2) {
            desc = `<div>All Corners</div>`
        }
        this.setDescription(desc)
    }

    update() {
        let animating = false

        for (let rot = 0; rot < 9; ++rot) {
            if (this.rots[rot] < 0) {
                this.rots[rot] += this.rotateSpeed
                if (this.rots[rot] > 0) this.rots[rot] = 0
            } else if (this.rots[rot] > 0) {
                this.rots[rot] -= this.rotateSpeed
                if (this.rots[rot] < 0) this.rots[rot] = 0
            }

            if (this.rots[rot] != 0) {
                animating = true
            }
        }

        const oldSpin = [this.spinX, this.spinY, this.spinZ]
        this.spinX = lerp(this.spinX, this.spinReqX, SPIN_SPEED)
        this.spinY = lerp(this.spinY, this.spinReqY, SPIN_SPEED)
        this.spinZ = lerp(this.spinZ, this.spinReqZ, SPIN_SPEED)
        if (this.spinX != oldSpin[0] || this.spinY != oldSpin[1] || this.spinZ != oldSpin[2]) {
            animating = true
        }

        if (!animating) {
            if (this.actions.length == 0) {
                this.rotateSpeed = ROTATE_SPEED
                this.updateDescription()
            } else {
                const a = this.actions.shift()

                if (a.action == ACTION_ROT) {
                    this.move(a.rot, a.clockwise)
                } else if (a.action == ACTION_LOOK) {
                    switch (a.rot) {
                        case ROT_X:
                            this.move(ROT_L, !a.clockwise)
                            this.move(ROT_X, a.clockwise)
                            this.move(ROT_R, a.clockwise)
                            break
                        case ROT_Y:
                            this.move(ROT_U, a.clockwise)
                            this.move(ROT_Y, a.clockwise)
                            this.move(ROT_D, !a.clockwise)
                            break
                        case ROT_Z:
                            this.move(ROT_B, a.clockwise)
                            this.move(ROT_Z, !a.clockwise)
                            this.move(ROT_F, !a.clockwise)
                            break
                    }
                }
            }
        }

        return animating
    }

    touched(event) {
        const x = Math.floor((3 * event.offsetX) / event.srcElement.clientWidth)
        const y = Math.floor((3 * event.offsetY) / event.srcElement.clientHeight)
        const which = y * 3 + x
        // console.log(`${x}, ${y} (index ${index})`)
        switch (which) {
            case 0: {
                window.cube.act(ACTION_LOOK, ROT_Z, true)
                break
            }
            case 1: {
                window.cube.act(ACTION_LOOK, ROT_X, true)
                break
            }
            case 2: {
                window.cube.act(ACTION_LOOK, ROT_Z, false)
                break
            }

            case 3: {
                window.cube.act(ACTION_LOOK, ROT_Y, true)
                break
            }
            case 4: {
                window.cube.act(ACTION_TILT, TILT_UD, true)
                break
            }
            case 5: {
                window.cube.act(ACTION_LOOK, ROT_Y, false)
                break
            }

            case 6: {
                window.cube.act(ACTION_LOOK, ROT_Z, true)
                break
            }
            case 7: {
                window.cube.act(ACTION_LOOK, ROT_X, false)
                break
            }
            case 8: {
                window.cube.act(ACTION_LOOK, ROT_Z, false)
                break
            }
        }
    }

    draw() {
        const animating = this.update()

        this.gl.clearColor(0.1, 0.1, 0.1, 1.0)
        this.gl.clearDepth(1.0)
        this.gl.enable(this.gl.BLEND)
        this.gl.enable(this.gl.CULL_FACE)
        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.depthFunc(this.gl.LEQUAL)

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer)
        this.gl.vertexAttribPointer(this.attribs.vertexPosition, 3, this.gl.FLOAT, false, 0, 0)
        this.gl.enableVertexAttribArray(this.attribs.vertexPosition)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer)
        this.gl.vertexAttribPointer(this.attribs.vertexTextureCoord, 2, this.gl.FLOAT, false, 0, 0)
        this.gl.enableVertexAttribArray(this.attribs.vertexTextureCoord)

        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.getTexture("cubie"))
        this.gl.uniform1i(this.program.u_Sampler, 0)

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        this.gl.useProgram(this.program)

        // Front
        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_U], this.rots[ROT_F], FACE_F, 0, 0, this.cubies[FACE_F][2])
        this.drawCubieFace(this.rots[ROT_X], this.rots[ROT_U], this.rots[ROT_F], FACE_F, 1, 0, this.cubies[FACE_F][1])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_U], this.rots[ROT_F], FACE_F, 2, 0, this.cubies[FACE_F][0])

        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_Y], this.rots[ROT_F], FACE_F, 0, 1, this.cubies[FACE_F][5])
        this.drawCubieFace(this.rots[ROT_X], this.rots[ROT_Y], this.rots[ROT_F], FACE_F, 1, 1, this.cubies[FACE_F][4])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_Y], this.rots[ROT_F], FACE_F, 2, 1, this.cubies[FACE_F][3])

        this.drawCubieFace(this.rots[ROT_R], -this.rots[ROT_D], this.rots[ROT_F], FACE_F, 0, 2, this.cubies[FACE_F][8])
        this.drawCubieFace(this.rots[ROT_X], -this.rots[ROT_D], this.rots[ROT_F], FACE_F, 1, 2, this.cubies[FACE_F][7])
        this.drawCubieFace(-this.rots[ROT_L], -this.rots[ROT_D], this.rots[ROT_F], FACE_F, 2, 2, this.cubies[FACE_F][6])

        // Back
        this.drawCubieFace(this.rots[ROT_R], -this.rots[ROT_D], -this.rots[ROT_B], FACE_B, 0, 0, this.cubies[FACE_B][6])
        this.drawCubieFace(this.rots[ROT_X], -this.rots[ROT_D], -this.rots[ROT_B], FACE_B, 1, 0, this.cubies[FACE_B][7])
        this.drawCubieFace(-this.rots[ROT_L], -this.rots[ROT_D], -this.rots[ROT_B], FACE_B, 2, 0, this.cubies[FACE_B][8])

        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_Y], -this.rots[ROT_B], FACE_B, 0, 1, this.cubies[FACE_B][3])
        this.drawCubieFace(this.rots[ROT_X], this.rots[ROT_Y], -this.rots[ROT_B], FACE_B, 1, 1, this.cubies[FACE_B][4])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_Y], -this.rots[ROT_B], FACE_B, 2, 1, this.cubies[FACE_B][5])

        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_U], -this.rots[ROT_B], FACE_B, 0, 2, this.cubies[FACE_B][0])
        this.drawCubieFace(this.rots[ROT_X], this.rots[ROT_U], -this.rots[ROT_B], FACE_B, 1, 2, this.cubies[FACE_B][1])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_U], -this.rots[ROT_B], FACE_B, 2, 2, this.cubies[FACE_B][2])

        // Up
        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_U], -this.rots[ROT_B], FACE_U, 0, 0, this.cubies[FACE_U][2])
        this.drawCubieFace(this.rots[ROT_X], this.rots[ROT_U], -this.rots[ROT_B], FACE_U, 1, 0, this.cubies[FACE_U][1])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_U], -this.rots[ROT_B], FACE_U, 2, 0, this.cubies[FACE_U][0])

        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_U], this.rots[ROT_Z], FACE_U, 0, 1, this.cubies[FACE_U][5])
        this.drawCubieFace(this.rots[ROT_X], this.rots[ROT_U], this.rots[ROT_Z], FACE_U, 1, 1, this.cubies[FACE_U][4])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_U], this.rots[ROT_Z], FACE_U, 2, 1, this.cubies[FACE_U][3])

        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_U], this.rots[ROT_F], FACE_U, 0, 2, this.cubies[FACE_U][8])
        this.drawCubieFace(this.rots[ROT_X], this.rots[ROT_U], this.rots[ROT_F], FACE_U, 1, 2, this.cubies[FACE_U][7])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_U], this.rots[ROT_F], FACE_U, 2, 2, this.cubies[FACE_U][6])

        // Down
        this.drawCubieFace(this.rots[ROT_R], -this.rots[ROT_D], this.rots[ROT_F], FACE_D, 0, 0, this.cubies[FACE_D][2])
        this.drawCubieFace(this.rots[ROT_X], -this.rots[ROT_D], this.rots[ROT_F], FACE_D, 1, 0, this.cubies[FACE_D][1])
        this.drawCubieFace(-this.rots[ROT_L], -this.rots[ROT_D], this.rots[ROT_F], FACE_D, 2, 0, this.cubies[FACE_D][0])

        this.drawCubieFace(this.rots[ROT_R], -this.rots[ROT_D], this.rots[ROT_Z], FACE_D, 0, 1, this.cubies[FACE_D][5])
        this.drawCubieFace(this.rots[ROT_X], -this.rots[ROT_D], this.rots[ROT_Z], FACE_D, 1, 1, this.cubies[FACE_D][4])
        this.drawCubieFace(-this.rots[ROT_L], -this.rots[ROT_D], this.rots[ROT_Z], FACE_D, 2, 1, this.cubies[FACE_D][3])

        this.drawCubieFace(this.rots[ROT_R], -this.rots[ROT_D], -this.rots[ROT_B], FACE_D, 0, 2, this.cubies[FACE_D][8])
        this.drawCubieFace(this.rots[ROT_X], -this.rots[ROT_D], -this.rots[ROT_B], FACE_D, 1, 2, this.cubies[FACE_D][7])
        this.drawCubieFace(-this.rots[ROT_L], -this.rots[ROT_D], -this.rots[ROT_B], FACE_D, 2, 2, this.cubies[FACE_D][6])

        // Left
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_U], this.rots[ROT_F], FACE_L, 0, 0, this.cubies[FACE_L][2])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_U], this.rots[ROT_Z], FACE_L, 1, 0, this.cubies[FACE_L][1])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_U], -this.rots[ROT_B], FACE_L, 2, 0, this.cubies[FACE_L][0])

        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_Y], this.rots[ROT_F], FACE_L, 0, 1, this.cubies[FACE_L][5])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_Y], this.rots[ROT_Z], FACE_L, 1, 1, this.cubies[FACE_L][4])
        this.drawCubieFace(-this.rots[ROT_L], this.rots[ROT_Y], -this.rots[ROT_B], FACE_L, 2, 1, this.cubies[FACE_L][3])

        this.drawCubieFace(-this.rots[ROT_L], -this.rots[ROT_D], this.rots[ROT_F], FACE_L, 0, 2, this.cubies[FACE_L][8])
        this.drawCubieFace(-this.rots[ROT_L], -this.rots[ROT_D], this.rots[ROT_Z], FACE_L, 1, 2, this.cubies[FACE_L][7])
        this.drawCubieFace(-this.rots[ROT_L], -this.rots[ROT_D], -this.rots[ROT_B], FACE_L, 2, 2, this.cubies[FACE_L][6])

        // Right
        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_U], -this.rots[ROT_B], FACE_R, 0, 0, this.cubies[FACE_R][2])
        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_U], this.rots[ROT_Z], FACE_R, 1, 0, this.cubies[FACE_R][1])
        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_U], this.rots[ROT_F], FACE_R, 2, 0, this.cubies[FACE_R][0])

        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_Y], -this.rots[ROT_B], FACE_R, 0, 1, this.cubies[FACE_R][5])
        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_Y], this.rots[ROT_Z], FACE_R, 1, 1, this.cubies[FACE_R][4])
        this.drawCubieFace(this.rots[ROT_R], this.rots[ROT_Y], this.rots[ROT_F], FACE_R, 2, 1, this.cubies[FACE_R][3])

        this.drawCubieFace(this.rots[ROT_R], -this.rots[ROT_D], -this.rots[ROT_B], FACE_R, 0, 2, this.cubies[FACE_R][8])
        this.drawCubieFace(this.rots[ROT_R], -this.rots[ROT_D], this.rots[ROT_Z], FACE_R, 1, 2, this.cubies[FACE_R][7])
        this.drawCubieFace(this.rots[ROT_R], -this.rots[ROT_D], this.rots[ROT_F], FACE_R, 2, 2, this.cubies[FACE_R][6])

        return animating
    }
}

async function main() {
    await preloadImages()

    console.log("Creating cube...")
    window.cube = new Cube("#cube")
    if (!window.cube.initGL()) {
        return
    }

    kick()
}

main()
