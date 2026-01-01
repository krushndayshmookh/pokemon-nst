const { makeNoise2D } = require('fast-simplex-noise'); const noise2D = makeNoise2D(() => Math.random()); console.log('noise2D(10,10):', noise2D(10, 10));
