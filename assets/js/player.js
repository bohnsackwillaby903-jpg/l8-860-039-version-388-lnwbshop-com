document.addEventListener('DOMContentLoaded', function () {
    var frames = Array.prototype.slice.call(document.querySelectorAll('.player-frame'));

    frames.forEach(function (frame) {
        var video = frame.querySelector('video');
        var button = frame.querySelector('.play-cover');
        var url = frame.getAttribute('data-video-url');
        var hlsInstance = null;
        var initialized = false;

        function attachSource() {
            if (!video || !url || initialized) {
                return;
            }

            initialized = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(video);
            } else {
                video.src = url;
            }
        }

        function startPlayback() {
            attachSource();
            if (button) {
                button.classList.add('hidden');
            }
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        }

        if (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                startPlayback();
            });
        }

        if (video) {
            video.addEventListener('click', function () {
                if (!initialized) {
                    startPlayback();
                }
            });
            video.addEventListener('play', function () {
                if (button) {
                    button.classList.add('hidden');
                }
            });
            video.addEventListener('emptied', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                    initialized = false;
                }
            });
        }
    });
});
