const play = (video: HTMLVideoElement) => {
  video.preload = 'auto';
  video.play().catch(() => {});
};

function playWhenVisible(videos: NodeListOf<HTMLVideoElement>): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) play(video);
        else video.pause();
      }
    },
    { rootMargin: '120px 0px' },
  );
  videos.forEach((video) => observer.observe(video));
}

export function initAutoplayVideos(selector = 'video[data-autoplay]'): void {
  const videos = document.querySelectorAll<HTMLVideoElement>(selector);
  if (videos.length === 0) return;
  playWhenVisible(videos);
}
