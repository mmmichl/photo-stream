/**
 * run this script to generate the `token.json` needed for the functions
 */

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const {SCOPES, CREDENTIAL_PATH, TOKEN_PATH} = require('./config');



fs.readFile(CREDENTIAL_PATH, (err, credentials) => {
  if (err) {
    return console.log('Error loading client secret file:', err);
  }
  // Authorize a client with credentials, then call the Google Drive API.
  const {client_secret, client_id, redirect_uris} = JSON.parse(credentials).installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  getAccessToken(oAuth2Client);
});


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error('Error writing token to file', err);
        console.log('Token stored to', TOKEN_PATH);
      });
    });
  });
}
