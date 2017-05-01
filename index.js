'use strict';
const https = require('https');
const Busboy = require('busboy');

const readPayload = payload => {
  const PLAY = 'media.play';
  const PAUSE = 'media.pause';
  const RESUME = 'media.resume';
  const STOP = 'media.stop';

  const { event, Player, Metadata } = payload;

  const options = {
    hostname: 'www.meethue.com',
    path: `/api/sendmessage?token=${process.env.HUE_TOKEN}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  if (
    process.env.PLAYER_UUID === Player.uuid &&
    Metadata.type === 'movie' &&
    (event === PLAY || event === STOP || event === PAUSE || event === RESUME)
  ) {
    const scene = event === PLAY || event === RESUME
      ? process.env.HUE_SCENE_THEATER
      : process.env.HUE_SCENE_DIMMED;

    const body = `clipmessage={ bridgeId: "${process.env.HUE_BRIDGE_ID}", clipCommand: { url: "/api/0/groups/${process.env.HUE_GROUP_ID}/action", method: "PUT", body: { scene: "${scene}" } } }`;
    const req = https.request(options);

    req.write(body);
    req.end();
  }
};

exports.handler = (event, context, callback) => {
  const headers = {};
  Object.keys(event.headers).forEach(
    key => (headers[key.toLowerCase()] = event.headers[key])
  );

  const busboy = new Busboy({
    headers: headers
  });

  busboy.on('field', (fieldname, value) => {
    if (fieldname === 'payload') {
      const payload = JSON.parse(value);

      readPayload(payload);

      callback(null, {
        payload
      });
    }
  });

  busboy.write(Buffer.from(event.body, 'base64'));
};
