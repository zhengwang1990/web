class VideoPlayButton {
  constructor(videoWrapper) {
    this.videoWrapper = videoWrapper;
    this.video = videoWrapper.getElementsByTagName('video')[0];
    this.videoWrapper.insertAdjacentHTML('beforeend', '\
                <svg class="video-overlay-play-button" viewBox="0 0 200 200" alt="Play video">\
                    <circle cx="100" cy="100" r="90" fill="none" stroke-width="15" stroke="#fff"/>\
                    <polygon points="70, 55 70, 145 145, 100" fill="#fff"/>\
                </svg>\
            ');
    this.videoPlayButton = videoWrapper.getElementsByClassName('video-overlay-play-button')[0];
    this.videoPlayButton.addEventListener('click', this.hideVideoPlayButton.bind(this));
  }

  hideVideoPlayButton() {
    this.video.play()
    this.videoPlayButton.classList.add('is-hidden')
    this.video.classList.remove('has-media-controls-hidden')
    this.video.setAttribute('controls', 'controls')
  }
}

var videoWrappers = document.getElementsByClassName('video-wrapper');
for (var i = 0; i < videoWrappers.length; i++) {
  var videoWrapper = videoWrappers[i];
  video = videoWrapper.getElementsByTagName('video')[0];
  new VideoPlayButton(videoWrapper);
}
