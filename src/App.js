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
import CircularProgress from '@material-ui/core/CircularProgress';
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import Dialog from "@material-ui/core/Dialog/Dialog";
import Snackbar from '@material-ui/core/Snackbar';
import Slide from '@material-ui/core/Slide';


const HOST = 'https://us-central1-wedding-1533550385088.cloudfunctions.net';
// const HOST = 'http://10.0.0.12:5000/wedding-1533550385088/us-central1';

const DEBUG_PIC_COUNT = 100;

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
  fabMoveUp: {
    transform: 'translate3d(0, -46px, 0)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.easeOut,
    }),
  },
  fabMoveDown: {
    transform: 'translate3d(0, 0, 0)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.leavingScreen,
      easing: theme.transitions.easing.sharp,
    }),
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

class App extends Component {
  constructor() {
    super();
    this.state = {
      consentDialog: false,
      fileUpload: false,
      loadingPhotos: false,
      photos: []
    };
  }

  render() {
    const fabClassName = this.props.classes.fab + ' ' + (this.state.fileUpload ? this.props.classes.fabMoveUp : this.props.classes.fabMoveDown);

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
            {this.state.photos ?
              <Gallery images={this.state.photos} enableImageSelection={false} tagStyle={tagStyle}/> : null}
            {this.state.loadingPhotos ?
              <Dialog open={true}>
                <DialogContent>
                  <CircularProgress size={20}/> Lade Bilder
                </DialogContent>
              </Dialog> : null}

            <input
              accept="image/*"
              className={this.props.classes.hidden}
              id="pic-upload-input2"
              type="file"
              onChange={evt => this.fileUpload(evt)}
            />
            <label htmlFor="pic-upload-input2">
              <Button component="span" variant="fab" className={fabClassName} color='secondary'>
                <PhotoCameraIcon/>
              </Button>
            </label>
            <Snackbar
              open={this.state.fileUpload}
              TransitionComponent={this.transitionUp}
              message={<span>Foto wird hochgeladen <CircularProgress size={20} color="secondary"/></span>}
            />
          </div>
        </div>
      </MuiThemeProvider>
    );
  }

  transitionUp(props) {
    return <Slide {...props} direction="up"/>;
  }

  componentDidMount() {
    this.fetchPhotos();
    this.checkForFirstVisit()
  }

  fetchPhotos() {
    this.setState({loadingPhotos: true});

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
      // .then(photos => photos.reduce((acc, cur) =>
      //   acc.concat(new Array(Math.round(DEBUG_PIC_COUNT / photos.length)).fill().map((_, i) => ({
      //     ...cur,
      //     thumbnailLink: cur.thumbnailLink + "?" + i
      //   }))), []))
      .then(photos => photos.map(p => ({
        src: p.thumbnailLink.replace('s220', 's640'),
        thumbnail: p.thumbnailLink,
        thumbnailWidth: p.imageMediaMetadata.rotation ? p.imageMediaMetadata.height : p.imageMediaMetadata.width,
        thumbnailHeight: p.imageMediaMetadata.rotation ? p.imageMediaMetadata.width : p.imageMediaMetadata.height,
        tags: p.description && [{value: p.description, title: p.description}],
      })))
      .then(photos => {
        console.log('got fotos', photos);
        this.setState({loadingPhotos: false, photos});
      })
      .catch(r => {
        console.error('error fetching list of photos', r);
      });
  }

  fileUpload(evt) {
    const self = this;
    let file = evt.currentTarget.files[0];

    if (!file) {
      // not picture selected or hit cancel
      return;
    }

    this.setState({fileUpload: true});
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
          self.setState({fileUpload: false});
          self.fetchPhotos();
        });
    };

    reader.readAsArrayBuffer(file);
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
