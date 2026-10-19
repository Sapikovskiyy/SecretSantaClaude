import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { color } from './config/brand'
import { MUSIC_VOLUME, TEASER_XFADE, scenes, sfxCues, teaserSegments } from './config/timeline'
import { Scene01Beginning } from './scenes/Scene01Beginning'
import { Scene02Intro } from './scenes/Scene02Intro'
import { Scene03Create } from './scenes/Scene03Create'
import { Scene04Invite } from './scenes/Scene04Invite'
import { Scene05Wishes } from './scenes/Scene05Wishes'
import { Scene06Reveal } from './scenes/Scene06Reveal'
import { Scene07Final } from './scenes/Scene07Final'

const SCENES = [
  ['01 Начало', scenes.s01, Scene01Beginning],
  ['02 Santomi', scenes.s02, Scene02Intro],
  ['03 Создай игру', scenes.s03, Scene03Create],
  ['04 Пригласи друзей', scenes.s04, Scene04Invite],
  ['05 Желания', scenes.s05, Scene05Wishes],
  ['06 Сюрприз', scenes.s06, Scene06Reveal],
  ['07 Финал', scenes.s07, Scene07Final],
] as const

/** Picture only. Composition size decides the layout (9:16 or 16:9). */
export function TrailerPicture() {
  return (
    <AbsoluteFill style={{ background: color.night }}>
      {SCENES.map(([name, w, Scene]) => (
        <Sequence key={name} from={w.from} durationInFrames={w.len} name={name}>
          <Scene />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

/** Main trailer: picture + original music + sound design. */
export function Trailer() {
  return (
    <AbsoluteFill>
      <TrailerPicture />
      <Audio src={staticFile('audio/music.wav')} volume={MUSIC_VOLUME} />
      {sfxCues.map((c, i) => (
        <Sequence key={i} from={c.at} name={`sfx ${c.file}`} layout="none">
          <Audio src={staticFile(`audio/${c.file}`)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

function Segment({ index, children }: { index: number; children: React.ReactNode }) {
  const f = useCurrentFrame()
  const fadeIn = index === 0 ? 1 : interpolate(f, [0, TEASER_XFADE], [0, 1], { extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ opacity: fadeIn }}>{children}</AbsoluteFill>
}

/** 15 s teaser: the strongest moments of the main cut, short crossfades, its own music bed. */
export function Teaser() {
  return (
    <AbsoluteFill style={{ background: color.night }}>
      {teaserSegments.map(([t, src, len], i) => {
        const lead = i === 0 ? 0 : TEASER_XFADE
        return (
          <Sequence key={i} from={t - lead} durationInFrames={len + lead} name={`teaser ${i + 1}`}>
            <Segment index={i}>
              <Sequence from={-(src - lead)} layout="absolute-fill">
                <TrailerPicture />
              </Sequence>
            </Segment>
          </Sequence>
        )
      })}
      <Audio src={staticFile('audio/music-teaser.wav')} volume={MUSIC_VOLUME} />
      {teaserSegments.flatMap(([t, src, len]) =>
        sfxCues
          .filter((c) => c.at >= src && c.at < src + len - 6)
          .map((c) => (
            <Sequence key={`${t}-${c.at}-${c.file}`} from={t + c.at - src} layout="none">
              <Audio src={staticFile(`audio/${c.file}`)} volume={c.volume} />
            </Sequence>
          )),
      )}
    </AbsoluteFill>
  )
}
