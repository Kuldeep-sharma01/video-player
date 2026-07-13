const filepath = '..\\..\\..\\N\\JUJUTSU.KAISEN.S03.1080p.CR.WEB-DL.MULTi.AAC2.0.H.264-4kHdHub.Com';
const dataset = [{
    title: 'jujitsu kaisen episode 48',
    file: {
        name: "JUJUTSU.KAISEN.S03E48.Execution.1080p.CR.WEB-DL.Multi.AAC2.0.H.264-4kHdHub.Com.mkv"
    },
    thumbnail: {
        name: ""
    }

}];
const fields = { title: '', file: '', thumbnail: '' };

const make = (tag, dest, cls, att = {}, lisnr) => {
    let el = Object.assign(document.createElement(tag), att);
    if (cls) el.className = cls;
    if (lisnr) el.onclick = lisnr;
    if (dest) dest.append(el);
    return el;
};

const div = (dest, cls, lisnr) => make('div', dest, cls, {}, lisnr);
const btn = (dest, text, lisnr) => make('button', dest, 'btn', { textContent: text, id: text, type: 'button' }, lisnr);
const title = (dest, dets, cls) => make('h3', dest, `title ${cls || ''}`.trim(), { textContent: dets.name || dets.title || dets.file?.name });
const video = (dest, dets, controls, cls) => {
    let posterSrc = "";
    if (dets.thumbnail) {
        // If the thumbnail is a generated Blob (like from our canvas), use createObjectURL
        if (dets.thumbnail instanceof Blob) {
            posterSrc = URL.createObjectURL(dets.thumbnail);
        }
        // If it's a regular file path string from the dataset
        else if (dets.thumbnail.name) {
            posterSrc = `..\\..\\..\\${dets.thumbnail.name}`;
        }
    }

    return make('video', dest, `video ${cls || ''}`.trim(), {
        src: `${filepath}\\${dets.file.name}`,
        controls,
        controlsList: 'nodownload noplaybackrate',
        disablePictureInPicture: true,
        poster: posterSrc
    });
};
const select = (dest, opts, cls, val) => {
    let s = make('select', dest, `select ${cls || ''}`.trim());
    opts.forEach(opt => {
        let isArray = Array.isArray(opt);
        let text = isArray ? opt[0] : opt;
        let isDisabled = isArray ? opt[1] : false;

        make('option', s, 'option', {
            textContent: text,
            value: text,
            disabled: isDisabled,
            selected: isDisabled
        });
    });
    return s;
};

const existDeleter = (clsList) => clsList.forEach(c => document.querySelectorAll(`.${c}`).forEach(el => el.remove()));
let shot = () => {
    let vid = document.querySelector('.video');
    let canvas = document.createElement('canvas');
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
    ctx.font = "20px Arial";
    ctx.fillStyle = 'white';
    ctx.filter = 'grayscale(100%) brightness(1.2)';
    ctx.fillText(`Time : ${Math.floor(vid.currentTime)}s`, 50, canvas.height - 50);
    return canvas;
}

const player = (dets) => {
    if (!dets.file?.name) return console.log('No data');
    existDeleter(['player', 'form']);

    let p = div(main, 'player');
    btn(p, 'Back', () => { p.remove(); form(fields); });
    btn(p, 'Edit', () => {
        document.querySelector('.custom-controls').remove();
        form(dets, dataset.indexOf(dets));
        document.querySelector('#Back').remove();
        document.querySelector('#Edit').remove();
        document.querySelector('.video').pause();
        document.querySelector('.form').append(p);
    });
    title(p, dets, 'player-title').style.textTransform = 'uppercase';
    let vid = video(p, dets, false);
    let seekBar = input(p, "range", "seekbar", "0");
    let control = div(p, 'custom-controls');
    let playBtn = btn(control, 'Play', () => {
        vid.paused ? vid.play() : vid.pause();
    });

    let skip = 10;
    let btnArr = ["<<", '>>'];
    btnArr.forEach(b => {
        btn(control, b, () => {
            if (b === '>>') {
                vid.currentTime += Number(skip);
            }
            else {
                vid.currentTime -= Number(skip);
            }
        }).addEventListener('contextmenu', (e) => {
            e.preventDefault();
            let newSkip = prompt('Enter new skip timing (seconds):', skip);
            if (newSkip !== null && !isNaN(newSkip)) {
                skip = Number(newSkip);
                e.target.textContent = `${skip} >>`;
            }
        });
    });
    let speedSelect = select(control, [['speed', true], 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]);
    speedSelect.onchange = (e) => vid.playbackRate = e.target.value;

    let speed = 2;
    let speedCheck = btn(control, `${speed}X`, () => {
        vid.playbackRate = vid.playbackRate !== speed ? speed : 1;
    });

    let A = [];
    btn(control, 'Repeat AB', (e) => {
        if (A.length < 2) {
            A.push(vid.currentTime);
        }
        else {
            A = [];
        }

        if (A.length == 1) {
            e.target.setAttribute('active', 'moderate');
        } else if (A.length == 2) {
            e.target.setAttribute('active', 'true');
        } else {
            e.target.setAttribute('active', 'false');
        }
    });
    let muteBtn = btn(control, "mute", () => {
        if (vid.muted || vid.volume === 0) {
            vid.muted = false;
            if (vid.volume === 0) {
                vid.volume = 1;
            }
        } else {
            vid.muted = true;
        }
    });

    let storageKey = 'videotime_' + dets.file.name;
    let volInput = input(control, 'range', 'volume', vid.volume, (e) => {
        vid.volume = e.target.value;
    });
    volInput.max = 1;
    volInput.step = 0.01;

    btn(control, 'SnapShot', () => {
        let canvas = shot();
        canvas.toBlob((blob) => {
            let url = URL.createObjectURL(blob);
            let link = document.createElement('a');
            link.href = url;
            link.download = `ss_${Math.floor(vid.currentTime)}s.png`;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    });

    let mediaRecorder;
    let recordedChunks = [];

    btn(control, 'Start Clip', () => {
        recordedChunks = [];
        let stream = vid.captureStream();
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            let blob = new Blob(recordedChunks, { type: 'video/webm' });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = `clip_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
        };

        mediaRecorder.start();
        console.log("Recording started...");
    });

    btn(control, 'Stop Clip', () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            console.log("Recording stopped and downloading...");
        }
    });

    let ambiCanvas = document.createElement('canvas');
    let ambiCtx = ambiCanvas.getContext('2d', { willReadFrequently: true });
    ambiCanvas.width = 10;
    ambiCanvas.height = 10;

    let ambilightLoop;

    const updateAmbilight = () => {
        if (vid.paused || vid.ended) return;

        ambiCtx.drawImage(vid, 0, 0, 10, 10);
        let frameData = ambiCtx.getImageData(0, 0, 10, 10).data;

        let r = 0, g = 0, b = 0;
        let totalPixels = frameData.length / 4;

        for (let i = 0; i < frameData.length; i += 4) {
            r += frameData[i];
            g += frameData[i + 1];
            b += frameData[i + 2];
        }

        let avgColor = `rgb(${Math.floor(r / totalPixels)}, ${Math.floor(g / totalPixels)}, ${Math.floor(b / totalPixels)})`;

        p.style.boxShadow = `0px 0px 50px 20px ${avgColor}`;

        ambilightLoop = requestAnimationFrame(updateAmbilight);
    };

    vid.addEventListener('play', () => { updateAmbilight(); });
    vid.addEventListener('pause', () => {
        cancelAnimationFrame(ambilightLoop);
    });
    let isRecordingGif = false;
    let gifInterval;
    let gif;

    btn(control, 'Make 3s GIF', () => {
        if (isRecordingGif) return;
        isRecordingGif = true;

        gif = new GIF({
            workers: 2,
            quality: 10,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
        });

        gif.on('finished', function (blob) {
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = `animation_${Date.now()}.gif`;
            a.click();
            URL.revokeObjectURL(url);
            isRecordingGif = false;
        });

        console.log("Recording GIF...");

        gifInterval = setInterval(() => {
            let canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 360;
            canvas.getContext('2d').drawImage(vid, 0, 0, canvas.width, canvas.height);

            gif.addFrame(canvas, { delay: 100 });
        }, 100);

        setTimeout(() => {
            clearInterval(gifInterval);
            console.log("Rendering GIF... (this might take a few seconds)");
            gif.render();
        }, 3000); s
    });


    let events = [{
        element: vid,
        events: [{ type: 'play', func: () => playBtn.textContent = 'Pause' }, { type: 'pause', func: () => playBtn.textContent = 'Play' }, {
            type: 'ratechange',
            func: () => {
                speedSelect.value = vid.playbackRate;
                if (vid.playbackRate === speed) {
                    speedCheck.setAttribute('active', 'true');
                }
                else {
                    speedCheck.setAttribute('active', 'false');
                }
            }
        }, {
            type: 'timeupdate', func: () => {
                seekBar.value = vid.currentTime;
                localStorage.setItem(storageKey, vid.currentTime);

                if (A.length == 2 && vid.currentTime >= Number(A[1])) {
                    vid.currentTime = Number(A[0]);
                }

            }
        }, {
            type: 'ratechange', func: () => {
                speedSelect.value = vid.playbackRate;
                if (vid.playbackRate === speed) {
                    speedCheck.setAttribute('active', 'true');
                }
                else {
                    speedCheck.setAttribute('active', 'false');
                }
            }
        }, {
            type: 'loadedmetadata', func: () => {
                let savedTime = Number(localStorage.getItem(storageKey));
                seekBar.max = vid.duration;
                seekBar.addEventListener('input', (e) => {
                    vid.currentTime = e.target.value;
                });
                if (savedTime) {
                    seekBar.value = savedTime;
                    vid.currentTime = savedTime;
                }
            }

        }, {
            type: 'dblclick', func: (event) => {
                if ((document.fullscreenElement === vid)) {
                    document.exitFullscreen();
                } else {
                    vid.requestFullscreen();
                }
            }
        },
        {
            type: 'volumechange', func: () => {
                volInput.value = vid.muted ? 0 : vid.volume;
                if (vid.muted || vid.volume === 0) {
                    muteBtn.textContent = 'unmute';
                    muteBtn.setAttribute('active', 'true');
                }
                else {
                    muteBtn.textContent = 'mute';
                    muteBtn.setAttribute('active', 'false');
                }
            }
        }],
    }, {
        element: speedCheck,
        events: [{
            type: 'contextmenu', func: (e) => {
                e.preventDefault();
                let newSpeed = Number(prompt('Enter new speed:', speed));
                if (newSpeed !== null && !isNaN(newSpeed)) {
                    speed = newSpeed;
                    vid.playbackRate = speed;
                    e.target.textContent = `${speed}X`;
                }
            }
        }]
    }];
    events.forEach(item => {
        item.events.forEach(e => {
            item.element.addEventListener(e.type, e.func);
        });
    });
};

const input = (dest, type = 'text', name = '', val = '', lisnr) => {
    let inp = make('input', dest, 'input', { type, name, placeholder: `Enter ${name}`, id: name, value: val }, lisnr);
    if (type === 'file') {
        inp.style.display = 'none';
        let b = btn(dest, `Upload ${name}`, () => inp.click());
        inp.onchange = (e) => {
            let file = e.target.files[0];
            b.textContent = file?.name || `Upload ${name}`;

            if (name === 'file' && file) {
                existDeleter(['form-video-preview']);

                make('video', dest, 'form-video-preview video', {
                    src: URL.createObjectURL(file),
                    controls: true,
                    disablePictureInPicture: true,
                    style: "margin-top: 10px; border-radius: 10px;" // Add a little styling
                });
            }
        };
        dest.addEventListener('reset', () => b.textContent = `Upload ${name}`);
    }
    return inp;
};

const form = (dets, id = null) => {
    existDeleter(['form']);
    let f = make('form', main, 'form');
    btn(f, 'Close', () => { f.remove(); let b = btn(main, 'Add', () => { b.remove(), form(fields); }); });
    title(f, { name: (id != null ? 'Edit' : 'Add') + ' Video' });

    for (let key in dets) {
        if (['file', 'thumbnail'].includes(key)) {
            if (id === null || key !== 'file') input(f, 'file', key);
        } else {
            input(f, 'text', key, dets[key]);
        }
    }
    input(f, 'submit', 'submit', 'Submit');

    f.onsubmit = (e) => {
        e.preventDefault();
        let data = Object.fromEntries(new FormData(e.target));

        delete data.submit;
        delete data.seekbar;

        const finalizeSubmit = () => {
            let newName = data.file?.name || '';
            data.title = data.title || newName;

            if (newName) {
                if (id !== null) dataset[id] = data;
                else if (dataset.some(v => v.file?.name === newName)) return alert(`The file ${data.title} is already present in the dataset.`);
                else dataset.unshift(data);

                f.remove();
                let search = document.getElementById('search');
                search?.value ? search.dispatchEvent(new Event('input')) : renderCards();
            }
        };

        if (id !== null) {
            data.file = dets.file;
        }
            let userUploadedThumb = data.thumbnail && data.thumbnail.size > 0;
            if (!userUploadedThumb) {
                let canvas = shot()

                canvas.toBlob(blob => {
                    data.thumbnail = blob;
                    finalizeSubmit();
                }, 'image/png');
                    return;
            }

        finalizeSubmit();
    };
};

const renderCards = (playlist = dataset) => {
    existDeleter(['cards']);
    let container = div(center, 'cards');
    playlist.forEach(ind => {
        if (ind.file?.name) {
            let card = div(container, 'card', () => player(ind));
            video(card, ind, false, 'card-video');
            title(card, ind, 'card-title');
        }
    });
};

const body = document.body;
const center = make('center', body, 'center');
const header = div(center, 'header');
title(header, { name: '* Moving Pictures *' });

const main = div(center, 'main');

form(fields);

input(header, 'text', 'search').oninput = (e) => {
    let s = e.target.value.toLowerCase();
    renderCards(dataset.filter(v =>
        (v.title?.toLowerCase().includes(s)) ||
        (v.file?.name?.toLowerCase().includes(s))
    ));
};
player(dataset[0]);

make('link', body, 'styles', { href: 'index.css', rel: 'stylesheet' });
