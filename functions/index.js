'use strict';

const fs = require('fs');
const {google} = require('googleapis');
const functions = require('firebase-functions');
const cors = require('cors')({
  origin: ['http://localhost:3000/', 'https://mmmichl.github.io/photo-stream/'],
});

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
        console.log('Error loading token file:', err);
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
      q: "'" + FOLDER_ID + "' in parents",
      'pageSize': 100,
      'fields': "nextPageToken, files(id, name, thumbnailLink)",
    }, (err, res) => {
      if (err) {
        console.log('The API returned an error: ' + err);
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
exports.listPhotos = functions.https.onRequest((request, response) => {
  // TODO reject any other method than GET
  return cors(request, response, () => {
    authorize((auth, err) => {
      if (err) return response.status(500).send("error: problem with authentication");
      queryPhotos(auth, (files, err) => {
        if (err) return response.status(500).send("error: talking to drive API");
        response.send(files);
      });
    });
  })
});


exports.uploadPhoto = functions.https.onRequest((req, res) => cors(req, res, () => {
  // TODO reject if other method than POST and filesize bigger than 30 MB
  authorize((auth, err) => {
    if (err) return response.status(500).send("error: problem with authentication");

    const fileName = 'DSC02608.JPG';
    const fileSize = fs.statSync(fileName).size;
    const drive = google.drive({version: 'v3', auth});
    const res = drive.files.create({
      resource: {
        name: new Date().toISOString() + '-' + fileName,
        originalFilename: fileName,
        parents: [FOLDER_ID]
      },
      media: {
        body: fs.createReadStream(fileName)
      }
    }, (err, fileInfoResp) => {
      console.log(fileInfoResp.data);
      res.send('upload success');
      return fileInfoResp.data;
    });
  });
}));
