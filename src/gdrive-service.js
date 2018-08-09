/* global gapi */

import {apiKey, clientId, discoveryDocs} from './gapi-config';


// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";


export function loadGapi(cb) {
  // window.gapi.load("client:auth2", () => initServiceClient(cb));
  window.gapi.load("client", () => initClient(cb));
}

async function initClient(cb) {
  // 2. Initialize the JavaScript client library.
  await window.gapi.client.init({
    apiKey: apiKey,
    clientId: clientId,
    discoveryDocs: discoveryDocs,
    scope: SCOPES
  });

  // Listen for sign-in state changes.
  gapi.auth2.getAuthInstance().isSignedIn.listen(() => {
    fetchFotos()
      .then(participents => cb(participents));
  });

  if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
    fetchFotos()
      .then(participents => cb(participents));
  } else {
    gapi.auth2.getAuthInstance().signIn();
  }
  console.log('after login status', gapi.auth2.getAuthInstance().isSignedIn.get());
}

async function fetchFotos() {
  const photoListRes = await gapi.client.drive.files.list({
    q: "'1e2YitWc6d0ya17BLo-0p_ZPIAz84DrfJ' in parents",
    'pageSize': 10,
    'fields': "nextPageToken, files(id, name, thumbnailLink)"
  });

  return photoListRes.result.files;
  // console.log('got files', photoListRes.result.files);
  // const response = photoListRes;
  // console.log('Files:');
  // var files = response.result.files;
  // if (files && files.length > 0) {
  //   for (var i = 0; i < files.length; i++) {
  //     var file = files[i];
  //     console.log(file.name + ' (' + file.id + ')');
  //   }
  // } else {
  //   console.log('No files found.');
  // }
}

export async function fetchFoto(fileId) {
  const photoRes = await gapi.client.drive.files.get({
    fields: "thumbnailLink",
    fileId: fileId,
    // alt: 'media'
  });

  const parsedBody = JSON.parse(photoRes.body);
  console.log('fetched photo', parsedBody.thumbnailLink);

  return parsedBody.thumbnailLink;
}
