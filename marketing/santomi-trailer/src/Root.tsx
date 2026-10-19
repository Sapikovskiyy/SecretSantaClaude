import { Composition } from 'remotion'
import { FPS, PREVIEW_FRAMES, TEASER_FRAMES, TRAILER_FRAMES } from './config/timeline'
import { formats } from './config/formats'
import { Teaser, Trailer } from './Trailer'

export function Root() {
  return (
    <>
      <Composition id="Trailer916" component={Trailer} durationInFrames={TRAILER_FRAMES} fps={FPS} {...formats.vertical} />
      <Composition id="Trailer169" component={Trailer} durationInFrames={TRAILER_FRAMES} fps={FPS} {...formats.horizontal} />
      <Composition id="Teaser15" component={Teaser} durationInFrames={TEASER_FRAMES} fps={FPS} {...formats.vertical} />
      <Composition id="Preview8s" component={Trailer} durationInFrames={PREVIEW_FRAMES} fps={FPS} {...formats.vertical} />
    </>
  )
}
