'use strict';

const fs = require('fs');
const {google} = require('googleapis');
const functions = require('firebase-functions');
// https://github.com/expressjs/body-parser#readme
const bodyParser = require('body-parser');
// https://github.com/expressjs/cors
const cors = require('cors')({
  origin: ['http://localhost:3000', 'http://10.0.0.12:3000', 'https://mmmichl.github.io', 'https://wedding.ressmann.io'],
});
const streamifier = require('streamifier');

const {CREDENTIAL_PATH, TOKEN_PATH} = require('./config');
const FOLDER_ID = '1e2YitWc6d0ya17BLo-0p_ZPIAz84DrfJ';


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
  fs.readFile(CREDENTIAL_PATH, (err, credentials) => {
    if (err) {
      console.error('Error loading client secret file:', err);
      return cb(null, err);
    }
    // Authorize a client with credentials, then call the Google Drive API.
    const {client_secret, client_id, redirect_uris} = JSON.parse(credentials).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        console.error('Error loading token file:', err);
        return cb(null, err);
      }
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  });
}


function queryPhotos(auth, cb) {
  try {
    const drive = google.drive({version: 'v3', auth});
    drive.files.list({
      q: "'" + FOLDER_ID + "' in parents and trashed = false",
      'pageSize': 1000,
      'fields': "nextPageToken, files(id, name, thumbnailLink, description, imageMediaMetadata(width, height, rotation))",
    }, (err, res) => {
      if (err) {
        console.error('The API returned an error: ' + err);
        return cb(null, err);
      }
      const files = res.data.files;
      console.log('no. of files read:', files.length);
      cb(files);
    });
  } catch (e) {
    console.error('queryPhotos - caught', e);
    return cb(null, e);
  }
}


/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
exports.listPhotos = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

    authorize((auth, err) => {
      if (err) return res.status(500).send("error: problem with authentication");
      queryPhotos(auth, (files, err) => {
        if (err) return res.status(500).send("error: talking to drive API");
        res.send(files);
      });
    });
  })
});


exports.uploadPhoto = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    console.log('content-type', req.get('Content-Type'), req.get('Content-Length'), req.get('X-Post-By'));
    const bodyParserImage = bodyParser.raw({
      type: 'image/*',
      limit: '10mb'
    });

    return bodyParserImage(req, res, () => {
        // console.log('body', req.body);

      authorize((auth, err) => {
        if (err) return response.status(500).send("error: problem with authentication");

        const poster = req.get('X-Post-By') || '???';
        const drive = google.drive({version: 'v3', auth});
        drive.files.create({
          resource: {
            name: new Date().toISOString() + '-' + poster,
            description: poster,
            // originalFilename: fileName,
            parents: [FOLDER_ID]
          },
          media: {
            body: streamifier.createReadStream(req.body)
          }
        }, (err, fileInfoResp) => {
          if (err) {
            console.error('The API returned an error: ', err);
            return res.status(500).send('error: talking to drive API');
          }
          console.log('Upload success:', fileInfoResp.data.name, '- id:', fileInfoResp.data.id);
          res.status(204).send();
        });
      });
    });
  })
});
