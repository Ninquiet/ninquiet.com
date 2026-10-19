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

function playOnHover(videos: NodeListOf<HTMLVideoElement>): void {
  videos.forEach((video) => {
    const host = video.closest<HTMLElement>('a, figure') ?? video;
    host.addEventListener('pointerenter', () => play(video));
    host.addEventListener('pointerleave', () => video.pause());
    host.addEventListener('focusin', () => play(video));
    host.addEventListener('focusout', () => video.pause());
  });
}

export function initAutoplayVideos(selector = 'video[data-autoplay]'): void {
  const videos = document.querySelectorAll<HTMLVideoElement>(selector);
  if (videos.length === 0) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) playOnHover(videos);
  else playWhenVisible(videos);
}
