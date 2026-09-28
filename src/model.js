// model.js: character model sheets (?model=snip). Not part of the video.
const MODELS = {
  snip(S) {
    frameWash(PAL.paper, 0);
    // a soft wash behind the lineup
    paint(ellPts(960, 960, 900, 460, 30), { fill: PAL.flameLt, fillOp: 70, bleed: .3, tex: .5, ink: null });
    const y = 1000, u = 24;
    snip(560, y, u, { eyes: 'normal', mouth: 'smile', aL: -.3, aR: -.3, cutL: .8, cutR: .8 });
    snip(900, y, u, { eyes: 'determined', mouth: 'flat', aL: .9, aR: .9, cutL: 1, cutR: 1, lookX: .3 });
    snip(1240, y, u, { eyes: 'happy', mouth: 'grin', aL: 1.3, aR: 1.3, cutL: .1, cutR: .1, blush: 1, dy: -.6, sq: -.15 });
    snip(1560, y, u * .8, { eyes: 'star', mouth: 'open', aL: .4, aR: 1.4, cutL: .6, cutR: 0, glow: .8 });
    snip(290, y, u * .8, { eyes: 'sad', mouth: 'wobble', aL: -1.1, aR: -1.1, cutL: .2, cutR: .2, flip: true });
    streamer(760, 1450, 13, { eyes: 'tired', mouth: 'flat', slump: .7, aL: -1.3, aR: -1.3, emote: 'zzz' });
    streamer(1180, 1450, 13, { eyes: 'happy', mouth: 'grin', aL: 1.2, aR: .4, emote: 'heart' });
  },
  cast(S) {
    frameWash(PAL.paper, 0);
    paint(ellPts(960, 960, 900, 520, 30), { fill: PAL.sky, fillOp: 60, bleed: .3, tex: .5, ink: null });
    cat(560, 900, 16, { pose: 'loaf' });
    cat(960, 900, 16, { pose: 'sit', eyes: 'open', lookX: .5 });
    cat(1340, 900, 16, { pose: 'sit', eyes: 'happy', flip: true });
    for (let i = 0; i < 8; i++) fan(420 + i * 155, 1400, 16, { seed: i, aL: i % 2 ? 1.3 : -1.1, aR: i % 3 ? 1.1 : -1.1, phone: i % 3 === 0, eyes: ['dot', 'happy', 'heart', 'star'][i % 4], mouth: ['smile', 'open', 'o', 'flat'][i % 4] });
  },
};
if (Q.get('model')) MODEL = MODELS[Q.get('model')];
