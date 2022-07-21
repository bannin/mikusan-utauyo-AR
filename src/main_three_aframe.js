const { Player } = TextAliveApp;
const token = "8JWGacd5r8DRBFfz";
const defaultSong = "https://piapro.jp/t/RoPB/20220122172830";  // デフォルトはせきこみごはん氏Loading Memories

const lyricsDOM = document.getElementById("lyricsCanvas");
const bt = document.getElementById("playBt");
const V_Color = [[187, 242, 187], [188, 139, 240]];         // 感情価(Valence)を色にマッピングしてみる
const allHandler = document.getElementById("allModels");    // モデルが入ってるDOMのルート
const mikusan = document.getElementById("model");           // ミクさんモデル

// モデルが読み込み完了しているかどうか
const vrmIsReady = function (_name){
    return document.querySelector('[vrm-model]').components["vrm-model"].isReady();
}
// モデルのアクション
const vrmPlayingAction = function(){
    return document.querySelector('[vrm-model]').components["vrm-model"].getAnimation();
}
// プレーヤーをつくる
const player = new Player({ app: { token: token }, valenceArousalEnabled: true, vocalAmplitudeEnabled: true });
player.addListener({
    // Appの準備が完了したとき
    onAppReady: (app) => {
        if (app.songUrl) {
            // 楽曲URLが指定されている
        } else {
            // 指定されていないとき
            player.createFromSongUrl(defaultSong);
        }
    },
    // 動画オブジェクトの準備が整ったとき（楽曲に関する情報を読み込み終わったとき）に呼ばれる
    onVideoReady: (v) => {
        // ローディング画面を消す
        document.getElementById("loading").style.display = "none";
        // 再生ボタンを表示する
        bt.style.display = "block";
        // 曲名と作曲者名の表示
        const songData = player.data.song;
        document.getElementById("songArtist").textContent = songData.artist.name;
        document.getElementById("songTitle").textContent = songData.name;
    },
    // 楽曲が変わったら呼ばれる
    onAppMediaChange: () => {
        // 画面表示をリセット

    },
    // 再生位置のアップデートがあると呼ばれる
    onTimeUpdate: () => {
        if (player.isPlaying) {
            // ビートを取得
            const timeA = player.timer.position;
            const timeB = player.timer.position + 250;
            const imaBeat = player.findBeat(timeA);
            // ビート
            const animation = vrmPlayingAction();
            //animation.setEffectiveTimeScale((imaBeat.duration / 125) / animation.getClip().duration);

            const imaChar = player.video.findChar(timeB);
            let vowelIsChanged;
            if (imaChar === null) {
                vowelIsChanged = vowel.set("");
            }
            else {
                vowelIsChanged = vowel.set(convertVowel(imaChar.text));
            }
            if (vowelIsChanged) {
                const imaVowel = vowel.get().next;
                if(imaVowel != "n")  mikusan.setAttribute("vrm-model", {shape: [`${vowel.get().next}`]});
            }

            // 歌詞の取得
            const imaKasi = player.video.findPhrase(timeB);
            let isChanged;
            if (imaKasi === null) {
                isChanged = lyric.set("");
            }
            else {
                isChanged = lyric.set(imaKasi.text);
            }
            if (isChanged) {
                console.log(imaKasi.text)
                lyric.change();
            }

            // V/A値取得
            const imaVA = player.getValenceArousal(timeA);
            // 色を変える
            const imaColor = [((1 + imaVA.v) * V_Color[0][0] - (1 - imaVA.v) * V_Color[1][0]), ((1 + imaVA.v) * V_Color[0][1] - (1 - imaVA.v) * V_Color[1][1]), ((1 + imaVA.v) * V_Color[0][2] - (1 - imaVA.v) * V_Color[1][2])];
            lyricsDOM.style.backgroundColor = `rgb(${imaColor[0]},${imaColor[1]},${imaColor[2]})`;
            // ボーカルの声量取得
            //const imaVel = player.getVocalAmplitude(timeA);
        }
    },
    // 再生開始で呼ばれる
    onPlay: () => {
        bt.textContent = "||";
    },
    onPause: () => {
        bt.textContent = "▶";
    },
    // 再生停止で呼ばれる
    onStop: () => {
        bt.textContent = "▶";
        // モデルアニメーションの準備
        if(vrmIsReady("model"))  mikusan.setAttribute("vrm-model", {animation: ["waving", THREE.LoopPingPong]});
    }
});

// 歌詞を二段構えで表示する
// @param {string} prev 一つ前に表示するもの
// @param {string} next 次に表示するもの
const lyric2dan = function (canvasId) {
    let prev = "";
    let next = "";
    let prevTarget = null;
    let nextTarget = null;
    let canvas = document.getElementById(canvasId);

    // テキストとそれに紐づくobjを設定
    function set(_txt, _target) {
        // 同じテキストを入力するのはだめ
        if (next !== _txt) {
            prev = next;
            next = _txt;
            return true;
        }
        return false;
    }
    function get() {
        return { prev: prev, next: next, prevTarget: prevTarget, nextTarget: nextTarget };
    }
    // 歌詞の表示切替
    function change() {
        prevTarget = nextTarget;
        nextTarget = document.createElement("p");
        nextTarget.className = "lyricsWords";
        nextTarget.textContent = next;

        // 次が空白ならば表示は追加しない
        if (next !== "") {
            canvas.appendChild(nextTarget);
            nextTarget.style.top = `${Math.random() * 500}px`;
        }
        if (prevTarget !== null) {
            prevTarget.addEventListener("animationend", (e) => {
                e.target.remove();
                prevTarget = null;
            });
            prevTarget.classList.remove("come");
            prevTarget.classList.add("leave");
        }
        nextTarget.classList.add("come");
        return get();
    }

    return { set: set, get: get, change: change }
}

// 歌詞ロード
const lyric = new lyric2dan("lyricsCanvas");
const vowel = new lyric2dan();

// 再生停止ボタン
const playStop = (e) => {
    if (player.isPlaying) {
        player.requestPause();
    }
    else {
        // モデルアニメーションの準備
        if(vrmIsReady("model"))  mikusan.setAttribute("vrm-model", {animation: ["singing", THREE.LoopPingPong]});
        player.requestPlay();
    }
}

// ひらがな・カタカナ→母音変換　パワフル実装
// 漢字の読みがなは推定が難しい
const convertVowel = (_char) => {
    if (_char.length > 1) return "";
    if (/[あかさたなはまやらわがざだばぱアカサタナハマヤラワガザダバパ]/.test(_char)) return "a";
    else if (/[いきしちにひみりぎじぢびぴイキシチニヒミリギジヂビピ]/.test(_char)) return "i";
    else if (/[うくすつぬふむゆるんぐずづぶぷウクスツヌフムユルングズヅブプヴ]/.test(_char)) return "u";
    else if (/[えけせてねへめれげぜでべぺエケセテネヘメレゲゼデベペ]/.test(_char)) return "e";
    else if (/[おこそとのほもよろをごぞどぼぽオコソトノホモヨロヲゴゾドボポ]/.test(_char)) return "o";
    else return "n";
}





// ボタンなどの初期設定
window.addEventListener("load", () => {
    document.getElementById("playBt").addEventListener("click", (e) => playStop());
    document.addEventListener("keydown", (e) => {
        if (e.key == " " || e.key == "　") playStop();
    });
    // ステージのサイズ調整
    document.getElementById("adjustSize").addEventListener("input", e => {
        const size = e.target.value;
        allHandler.setAttribute("scale", `${size} ${size} ${size}`);
    });
    // 縦回転モード
    document.getElementById("tateroll").addEventListener("change", e => {
        if(e.target.checked)  allHandler.setAttribute("rotation", "-90 0 0");
        else  allHandler.setAttribute("rotation", "0 0 0");
    });
    document.querySelector("a-scene").renderer.gammaOutput=true;
});