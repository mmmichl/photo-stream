import React, {Component} from 'react';
import './App.css';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {withStyles} from '@material-ui/core/styles';
import Gallery from 'react-grid-gallery';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';

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
  hidden: {
    display: 'none',
  },
  gridList: {
    width: 500,
    height: 450,
  },
});

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
      view: VIEW.LOAD_PHOTOS,
      photos: null
    };
  }

  render() {
    return (
      <div className={this.props.classes.root}>
        <AppBar position="fixed" color="default">
          <Toolbar>
            <Typography variant="title" color="inherit" className={this.props.classes.flex}>
              Annas <span role="img" aria-label="Brautpaar">👰 ⚭ 🤵</span>
            </Typography>
            <input
              accept="image/*"
              className={this.props.classes.hidden}
              id="pic-upload-input"
              type="file"
              onChange={evt => this.fileUpload(evt)}
            />
            <label htmlFor="pic-upload-input">
              <Button component="span" variant="outlined" className={this.props.classes.button}>
                <PhotoCameraIcon/>
                Neues Foto
              </Button>
            </label>
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
              return this.state.photos ? <Gallery images={this.state.photos} enableImageSelection={false}/> : null;
            case VIEW.VIEW_PHOTOS:
              return this.state.photos ? <GridList cellHeight={160} className={this.props.classes.gridList} cols={3}>
                {this.state.photos.map(photo => (
                  <GridListTile key={photo.id} cols={1}>
                    <img src={photo.thumbnailLink}/>
                  </GridListTile>
                ))}
              </GridList> : null;
            default:
              return <span>Es ist ein Fehler aufgetreten, bitte die Seite neu laden!</span>;
          }
        })()}
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.fetchPhotos();
  }

  fetchPhotos() {
    this.setState({view: VIEW.LOAD_PHOTOS});

    // fetch('http://localhost:5000/wedding-1533550385088/us-central1/listPhotos', {
    fetch('https://us-central1-wedding-1533550385088.cloudfunctions.net/listPhotos', {
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
        thumbnailWidth: p.imageMediaMetadata.width,
        thumbnailHeight: p.imageMediaMetadata.height,
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
    let file = evt.currentTarget.files[0];
    if (!file) {
      alert('Kein Bild ausgewählt!');
      return;
    }

    this.setState({view: VIEW.UPLOAD});
    console.log('got file to upload', file);

    var reader = new FileReader();

    reader.onload = function (onLoadEvent) {
      var buffer = onLoadEvent.target.result;
      var uint8 = new Uint8Array(buffer); // Assuming the binary format should be read in unsigned 8-byte chunks

      return fetch('https://us-central1-wedding-1533550385088.cloudfunctions.net/uploadPhoto', {
        mode: 'cors',
        headers: {
          'Content-Type': file.type,
          'X-Post-by': file.name
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

export default withStyles(styles)(App);
