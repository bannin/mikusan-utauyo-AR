AFRAME.registerComponent("vrm-model", {
    schema: {
        vrmModel: { default: "https://daradaras.group/others/miku/models/mikusan.vrm" },
        animation: { default: [""] },
        shape: {default: [""] },
    },
    init: function () {
        this.vrm;
        this.animationMixer;
        this.ready;
        this.prevAction;
        this.prevShape;
        this.shapeList = new Map();
        this.clipList = new Map();
        const loader = new THREE.GLTFLoader();
        loader.load(this.data.vrmModel, gltf => {
            THREE.VRM.from(gltf).then(vrm => {
                this.vrm = vrm;
                // アニメーションの準備
                fetch("https://daradaras.group/others/miku/models/mikusan_Waving.json").then(res => {
                    return res.json();
                }).then(json => {

                    // デフォルトモーションの読み込みと設定　もうちょっと汎用性ある形にしたい
                    const mikuWavingClip = THREE.AnimationClip.parse(json);
                    mikuWavingClip.name = "waving";
                    this.setAnimation(mikuWavingClip);
                    this.data.animation = ["waving", THREE.LoopPingPong];
                    this.ready = true;
                    this.startAnimation(...this.data.animation);
                    this.prepareAnimation();
                    this.el.setObject3D("mesh", this.vrm.scene);
                });
                fetch("https://daradaras.group/others/miku/models/mikusan_Singing.json").then(res => {
                    return res.json();
                }).then(json => {
                    const mikuSingingClip = THREE.AnimationClip.parse(json);
                    mikuSingingClip.name = "singing";
                    this.setAnimation(mikuSingingClip);
                });
                this.animationMixer = new THREE.AnimationMixer(this.vrm.scene);
                this.setShapeAnimation(mikuShapes);                
            });
        });
    },
    tick: function (time, deltaTime) {
        if (this.ready){
            this.vrm.update(deltaTime / 1000);
            this.animationMixer.update(deltaTime / 1000);
        }
    },
    update: function (oldData) {
        const changes = AFRAME.utils.diff(this.data, oldData);
        // アニメーション管理
        if("animation" in changes){
            if(changes.animation !== undefined){
                if(changes.animation[0] !== this.data.animation[0]) this.startAnimation(...this.data.animation);
            }
        }
        if("shape" in changes){
            if(changes.shape !== undefined){
                console.log(changes.shape[0], this.data.shape[0])
                if(changes.shape[0] !== this.data.shape[0]) this.startShapeAnimation(...this.data.shape);
            }
        }
    },

    // custom obj
    prepareAnimation() {
        if (!this.ready) return;
        this.shapeJSON.forEach(item => {
            this.shapeList.set(item.name, new THREE.AnimationClip(item.name, -1, [
                new THREE.NumberKeyframeTrack(
                    this.vrm.blendShapeProxy.getBlendShapeTrackName(item.target), // name
                    item.animation.times, // times
                    item.animation.values, // values
                    item.animation.interpolate // 補間モード
                )
            ]))
        });
    },
    setShapeAnimation(_input) {
        this.shapeJSON = _input;
        this.prepareAnimation();
    },
    startShapeAnimation(_name, _loop = THREE.LoopOnce, _timeScale = 1, _startTime = 0, _crossDuration = 0.2) {
        if (!this.ready) return false;
        const clip = this.shapeList.get(_name);
        if (this.prevShape === undefined && clip === undefined) return;
        this.prevShape = this.startAction(clip, this.prevShape, _loop, _timeScale, _startTime, _crossDuration);
    },
    setAnimation(_clip) {
        this.clipList.set(_clip.name, _clip);
    },
    startAnimation(_name, _loop = THREE.LoopOnce, _timeScale = 1, _startTime = 0, _crossDuration = 0.2) {
        if (!this.ready) return false;
        const clip = this.clipList.get(_name);
        if (this.prevAction === undefined && clip === undefined) return;
        this.prevAction = this.startAction(clip, this.prevAction, _loop, _timeScale, _startTime, _crossDuration);
    },
    stopAnimation() {
        this.prevAction.stop();
    },
    getAnimation() {
        return this.prevAction;
    },
    startAction(_clip, _prev, _loop = THREE.LoopOnce, _timeScale = 1, _startTime = 0, _crossDuration = 0.2) {
        if (_clip === undefined) {
            _prev.reset()
                .setEffectiveTimeScale(-1)
                .setLoop(THREE.LoopOnce);
            _prev.play();
        }        
        // 同じクリップに対するActionはいい感じにマージされちゃうので、何度も使いたいときはreset必要
        else if (_prev === undefined) {
            const action = this.animationMixer.clipAction(_clip)
                .reset()
                .setEffectiveTimeScale(_timeScale)
                .startAt(_startTime);
            action.clampWhenFinished = true;
            action.loop = _loop;
            if (_loop == THREE.LoopRepeat) action.repetitions = Infinity;
            action.play();
            return action;
        }
        // 前と同じクリップが設定されたら無視する
        else if (_clip.name === _prev.getClip().name)  return _prev;
        else {
             const action = this.animationMixer.clipAction(_clip)
                .reset()
                .setEffectiveTimeScale(_timeScale)
                .startAt(_startTime)
                .crossFadeFrom(_prev, _crossDuration);
            action.clampWhenFinished = true;
            action.loop = _loop;
            if (_loop == THREE.LoopRepeat) action.repetitions = Infinity;
            if (_prev.getClip().name !== _clip.name) action.reset();
            action.play();
            console.log("action", action);
            return action;
        }
    },
    isReady(){
        return this.ready;
    }
});
// アニメーションの設定
const mikuShapes = [
    {
        "name": "a",
        "mode": "shape",
        "target": "a",
        "animation": {
            "times": [0.0, 0.15], // times
            "values": [0.0, 0.75], // values
            "interpolate": THREE.InterpolateSmooth // 補間モード
        }
    },
    {
        "name": "i",
        "mode": "shape",
        "target": "i",
        "animation": {
            "times": [0.0, 0.15], // times
            "values": [0.0, 0.75], // values
            "interpolate": THREE.InterpolateSmooth // 補間モード
        }
    },
    {
        "name": "u",
        "mode": "shape",
        "target": "u",
        "animation": {
            "times": [0.0, 0.15], // times
            "values": [0.0, 0.75], // values
            "interpolate": THREE.InterpolateSmooth // 補間モード
        }
    },
    {
        "name": "e",
        "mode": "shape",
        "target": "e",
        "animation": {
            "times": [0.0, 0.15], // times
            "values": [0.0, 0.75], // values
            "interpolate": THREE.InterpolateSmooth // 補間モード
        }
    },
    {
        "name": "o",
        "mode": "shape",
        "target": "o",
        "animation": {
            "times": [0.0, 0.15], // times
            "values": [0.0, 0.8], // values
            "interpolate": THREE.InterpolateSmooth // 補間モード
        }
    }
];
