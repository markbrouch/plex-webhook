'use strict';
const https = require('https');
const Busboy = require('busboy');

const readPayload = payload => {
  // Plex webhook event constants
  const PLAY = 'media.play';
  const PAUSE = 'media.pause';
  const RESUME = 'media.resume';
  const STOP = 'media.stop';

  const { event, Player, Metadata } = payload;

  // https options
  const options = {
    hostname: 'www.meethue.com',
    path: `/api/sendmessage?token=${process.env.HUE_TOKEN}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  if (
    process.env.PLAYER_UUID === Player.uuid && // Event came from the correct player
    Metadata.type === 'movie' && // Event type is from a movie
    (event === PLAY || event === STOP || event === PAUSE || event === RESUME) // Event is a valid type
  ) {
    const scene = event === PLAY || event === RESUME
      ? process.env.HUE_SCENE_THEATER // Turn the lights off because it's playing
      : process.env.HUE_SCENE_DIMMED; // Turn the lights on because it's not playing

    // Construct Hue API body
    const body = `clipmessage={ bridgeId: "${process.env.HUE_BRIDGE_ID}", clipCommand: { url: "/api/0/groups/${process.env.HUE_GROUP_ID}/action", method: "PUT", body: { scene: "${scene}" } } }`;

    // Send request to Hue API
    const req = https.request(options);
    req.write(body);

    req.end();
  }
};

exports.handler = (event, context, callback) => {
  // Busboy expects headers to be lower-case
  const headers = {};
  Object.keys(event.headers).forEach(
    key => (headers[key.toLowerCase()] = event.headers[key])
  );

  const busboy = new Busboy({
    headers
  });

  // For each field in the request
  busboy.on('field', (fieldname, value) => {
    // Check for the Plex webhook's payload field
    if (fieldname === 'payload') {
      const payload = JSON.parse(value);

      // Read the payload to control Hue lights
      readPayload(payload);

      // Send payload in response for testing & debugging
      callback(null, {
        payload
      });
    }
  });

  // Pipe Base64 encoded body from API Gateway to Busboy
  busboy.write(Buffer.from(event.body, 'base64'));
};
