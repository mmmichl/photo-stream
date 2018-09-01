import React, {Component} from 'react';
import './App.css';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {createMuiTheme, MuiThemeProvider, withStyles} from '@material-ui/core/styles';
import Gallery from 'react-grid-gallery';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import ConsentDialog from "./ConsentDialog";


const HOST = 'https://us-central1-wedding-1533550385088.cloudfunctions.net';
// const HOST = 'http://10.0.0.12:5000/wedding-1533550385088/us-central1';


const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#086e83',
    },
    secondary: {
      main: '#D09A37',
    },
  },
});

const styles = theme => ({
  root: {
    // display: 'flex',
    backgroundColor: theme.palette.background.paper,
    // flexDirection: 'horizontal'
  },
  flex: {
    flexGrow: 1,
  },
  button: {
    margin: theme.spacing.unit,
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
  },
  hidden: {
    display: 'none',
  },
  gridList: {
    width: 500,
    height: 450,
  },
});


const tagStyle = {
  color: '#D09A37',
  padding: '0.2em 0.6em 0.3em',
  fontSize: '75%',
  fontWeight: '400',
  lineHeight: '1',
  background: 'rgba(0, 0, 0, 0.65)',
  textAlign: 'center',
  borderRadius: '0.25em',
// white-space: nowrap;
// vertical-align: baseline;
};

const VIEW = {
  LOAD_PHOTOS: 1,
  VIEW_PHOTOS: 2,
  UPLOAD: 3,
  ERROR: 4
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      consentDialog: false,
      view: VIEW.LOAD_PHOTOS,
      photos: null
    };
  }

  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <div className={this.props.classes.root}>
          <ConsentDialog open={this.state.consentDialog} onClose={() => this.setState({consentDialog: false})}/>
          <AppBar position="fixed" color="primary">
            <Toolbar>
              <Typography variant="title" color="inherit" className={this.props.classes.flex}>
                Anna <span role="img" aria-label="Brautpaar">👰 ⚭ 🤵</span> Michl
              </Typography>
            </Toolbar>
          </AppBar>

          <div className="content">
            {(() => {
              switch (this.state.view) {
                case VIEW.LOAD_PHOTOS:
                  return <span>Fotos werden geladen...</span>;
                case VIEW.UPLOAD:
                  return <span>Foto wird hochgeladen...</span>;
                case VIEW.VIEW_PHOTOS:
                  return this.state.photos ? <Gallery images={this.state.photos} enableImageSelection={false}
                                                      tagStyle={tagStyle}/> : null;
                default:
                  return <span>Es ist ein Fehler aufgetreten, bitte die Seite neu laden!</span>;
              }
            })()}

            <input
              accept="image/*"
              className={this.props.classes.hidden}
              id="pic-upload-input2"
              type="file"
              onChange={evt => this.fileUpload(evt)}
            />
            <label htmlFor="pic-upload-input2">
              <Button component="span" variant="fab" className={this.props.classes.fab} color='secondary'>
                <PhotoCameraIcon/>
              </Button>
            </label>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }

  componentDidMount() {
    this.fetchPhotos();
    this.checkForFirstVisit()
  }

  fetchPhotos() {
    this.setState({view: VIEW.LOAD_PHOTOS});

    // fetch('http://localhost:5000/wedding-1533550385088/us-central1/listPhotos', {
    fetch(HOST + '/listPhotos', {
      mode: 'cors'
    })
      .then(response => {
        if (response.status >= 300) {
          throw response;
        }
        return response;
      })
      .then(response => response.json())
      .then(photos => photos.map(p => ({
        src: p.thumbnailLink.replace('s220', 's640'),
        thumbnail: p.thumbnailLink.replace('s220', 's640'),
        thumbnailWidth: p.imageMediaMetadata.rotation ? p.imageMediaMetadata.height : p.imageMediaMetadata.width,
        thumbnailHeight: p.imageMediaMetadata.rotation ? p.imageMediaMetadata.width : p.imageMediaMetadata.height,
        tags: p.description && [{value: p.description, title: p.description}],
      })))
      .then(photos => {
        console.log('got fotos', photos);
        this.setState({view: VIEW.VIEW_PHOTOS, photos});
      })
      .catch(r => {
        console.error('error fetching list of photos', r);
      });
  }

  fileUpload(evt) {
    const self = this;
    let files = evt.currentTarget.files;

    if (!files || files.length === 0) {
      // not picture selected or hit cancel
      return;
    }

    for (let file of files) {
      this.setState({view: VIEW.UPLOAD});
      console.log('got file to upload', file);

      var reader = new FileReader();

      reader.onload = function (onLoadEvent) {
        var buffer = onLoadEvent.target.result;
        var uint8 = new Uint8Array(buffer); // Assuming the binary format should be read in unsigned 8-byte chunks

        return fetch(HOST + '/uploadPhoto', {
          mode: 'cors',
          headers: {
            'Content-Type': file.type,
            'X-Post-by': localStorage.getItem('name') || 'unknown'
          },
          method: 'POST',
          body: uint8
        }).then(resp => resp.text())
          .then(txt => {
            console.log('file upload success', txt);
            self.fetchPhotos();
          });
      };

      reader.readAsArrayBuffer(file);
    }
  }

  /**
   * check if this is the first visit. Then show the consent dialog
   */
  checkForFirstVisit() {
    if (!localStorage.getItem('name')) {
      this.setState({consentDialog: true})
    }
  }
}

export default withStyles(styles)(App);
