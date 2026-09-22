import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Volume2, Video, FastForward, Clock } from 'lucide-react';
import styles from './MediaPlayer.module.css';

interface MediaPlayerProps {
  type: 'video' | 'audio';
  src: string;
  title?: string;
  subtitle?: string;
  mediaId?: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const pathParts = parsed.pathname.split('/');
      const embedIdx = pathParts.indexOf('embed');
      if (embedIdx !== -1 && pathParts[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(pathParts[embedIdx + 1])) {
        return pathParts[embedIdx + 1];
      }
    } else if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      if (id && /^\d{4,15}$/.test(id)) return id;
    }
  } catch {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d{4,15})/);
    return match ? match[1] : null;
  }
  return null;
}

function isSafeDirectMediaSrc(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/');
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  type,
  src,
  title = 'Course Media Attachment',
  subtitle,
  mediaId,
  initialTime = 0,
  onTimeUpdate
}) => {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [hasRestoredTime, setHasRestoredTime] = useState<boolean>(false);
  
  const lastSavedTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(initialTime);

  const flushTimeUpdate = useCallback(() => {
    if (onTimeUpdate && currentTimeRef.current > 0) {
      onTimeUpdate(currentTimeRef.current);
      lastSavedTimeRef.current = Date.now();
    }
  }, [onTimeUpdate]);

  // Restore saved position on load, waiting for metadata if not ready
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || initialTime <= 0 || hasRestoredTime) return;

    const applyTime = () => {
      try {
        if (Number.isFinite(el.duration) && initialTime < el.duration) {
          el.currentTime = initialTime;
        } else if (el.duration === 0 || !Number.isFinite(el.duration)) {
          el.currentTime = initialTime;
        }
        setHasRestoredTime(true);
      } catch {
        // Suppress audio seek exceptions
      }
    };

    if (el.readyState >= 1) {
      applyTime();
    } else {
      el.addEventListener('loadedmetadata', applyTime, { once: true });
      return () => {
        el.removeEventListener('loadedmetadata', applyTime);
      };
    }
  }, [initialTime, hasRestoredTime]);

  // Flush timestamp on component unmount
  useEffect(() => {
    return () => {
      flushTimeUpdate();
    };
  }, [flushTimeUpdate]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    const current = mediaRef.current.currentTime;
    currentTimeRef.current = current;

    const now = Date.now();
    // Throttle IndexedDB write: at most once every 3000ms during active playback
    if (now - lastSavedTimeRef.current >= 3000) {
      flushTimeUpdate();
    }
  };

  // Check for YouTube / Vimeo embeds with strict ID extraction
  const ytId = extractYouTubeId(src);
  if (ytId) {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}`;
    return (
      <div className={styles.mediaContainer}>
        <div className={styles.embedWrapper}>
          <iframe
            src={embedUrl}
            title={title}
            className={styles.embedIframe}
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className={styles.mediaCaption}>
          <span>{title}</span>
          <span style={{ fontSize: 11, color: 'var(--muted-text)' }}>YouTube Stream</span>
        </div>
      </div>
    );
  }

  const vimeoId = extractVimeoId(src);
  if (vimeoId) {
    const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
    return (
      <div className={styles.mediaContainer}>
        <div className={styles.embedWrapper}>
          <iframe
            src={embedUrl}
            title={title}
            className={styles.embedIframe}
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className={styles.mediaCaption}>
          <span>{title}</span>
          <span style={{ fontSize: 11, color: 'var(--muted-text)' }}>Vimeo Stream</span>
        </div>
      </div>
    );
  }

  const isSafeSrc = isSafeDirectMediaSrc(src);
  if (!isSafeSrc) {
    return (
      <div className={styles.mediaContainer}>
        <div className={styles.mediaCaption} style={{ color: 'var(--accent-primary)' }}>
          Untrusted media source protocol blocked.
        </div>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className={styles.mediaContainer}>
        <div className={styles.videoWrapper}>
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            controls
            className={styles.videoElement}
            onTimeUpdate={handleTimeUpdate}
            onPause={flushTimeUpdate}
            onEnded={flushTimeUpdate}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <div className={styles.mediaCaption}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Video size={14} color="var(--accent-pink)" />
            <span>{title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className={styles.speedSelector}
              value={playbackSpeed}
              onChange={e => handleSpeedChange(parseFloat(e.target.value))}
              aria-label="Playback speed"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  // Audio player
  return (
    <div className={styles.mediaContainer}>
      <div className={styles.audioWrapper}>
        <div className={styles.audioHeader}>
          <div className={styles.audioTitleGroup}>
            <div className={styles.audioIcon}>
              <Volume2 size={16} />
            </div>
            <div>
              <div className={styles.audioTitle}>{title}</div>
              {subtitle && <div className={styles.audioSubtitle}>{subtitle}</div>}
            </div>
          </div>

          <select
            className={styles.speedSelector}
            value={playbackSpeed}
            onChange={e => handleSpeedChange(parseFloat(e.target.value))}
            aria-label="Audio playback speed"
          >
            <option value="0.75">0.75x</option>
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>

        <div className={styles.audioControlsRow}>
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={src}
            controls
            className={styles.audioElement}
            onTimeUpdate={handleTimeUpdate}
            onPause={flushTimeUpdate}
            onEnded={flushTimeUpdate}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    </div>
  );
};
