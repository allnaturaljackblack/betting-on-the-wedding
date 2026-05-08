import { useState, useEffect, useRef } from 'react'

function isVideo(url) {
  return /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(url)
}

export default function AnswerMedia({ question }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const touchStartX = useRef(null)

  const items = Array.isArray(question.answer_media_urls) ? question.answer_media_urls : []
  const youtubeMatch = question.answer_media_url?.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e) {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex((i) => Math.min(i + 1, items.length - 1))
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, items.length])

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  if (!items.length && !youtubeMatch) return null

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -50 && lightboxIndex < items.length - 1) setLightboxIndex((i) => i + 1)
    if (dx > 50 && lightboxIndex > 0) setLightboxIndex((i) => i - 1)
  }

  const currentUrl = lightboxIndex !== null ? items[lightboxIndex] : null

  return (
    <>
      {items.length > 0 && (
        <div className="answer-gallery">
          {items.map((url, i) => (
            <div key={i} className="answer-gallery-thumb" onClick={() => setLightboxIndex(i)}>
              {isVideo(url) ? (
                <>
                  <video src={url} preload="metadata" muted playsInline />
                  <span className="gallery-play-icon">▶</span>
                </>
              ) : (
                <>
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }}
                  />
                  <span className="gallery-expand-hint">⤢</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {youtubeMatch && (
        <div className="answer-media answer-media-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Answer video"
          />
        </div>
      )}

      {lightboxIndex !== null && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>✕</button>

          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {isVideo(currentUrl) ? (
              <video
                key={currentUrl}
                src={currentUrl}
                controls
                autoPlay
                playsInline
                className="lightbox-video"
              />
            ) : (
              <img
                src={currentUrl}
                alt={`Photo ${lightboxIndex + 1}`}
                className="lightbox-img"
              />
            )}
            {question.answer_context && (
              <p className="lightbox-context">{question.answer_context}</p>
            )}
            {items.length > 1 && (
              <p className="lightbox-counter">{lightboxIndex + 1} / {items.length}</p>
            )}
          </div>

          {items.length > 1 && lightboxIndex > 0 && (
            <button
              className="lightbox-nav lightbox-prev"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i - 1) }}
            >‹</button>
          )}
          {items.length > 1 && lightboxIndex < items.length - 1 && (
            <button
              className="lightbox-nav lightbox-next"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i + 1) }}
            >›</button>
          )}
        </div>
      )}
    </>
  )
}
