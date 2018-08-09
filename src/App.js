import React, {Component} from 'react';
import './App.css';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {withStyles} from '@material-ui/core/styles';
import {fetchFoto, loadGapi} from "./gdrive-service";
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';

const styles = theme => ({
   root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
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


class App extends Component {
  constructor() {
    super();
    this.state = {
      photos: null
    };
  }

  render() {
    return (
      <div className={this.props.classes.root}>
        <AppBar position="static" color="default">
          <Toolbar>
            <Typography variant="title" color="inherit" className={this.props.classes.flex}>
              Annas <span role="img" aria-label="Brautpaar">👰 ⚭ 🤵</span>
            </Typography>
            <input
              accept="image/*"
              className={this.props.classes.hidden}
              id="pic-upload-input"
              type="file"
              onChange={this.fileUpload}
            />
            <label htmlFor="pic-upload-input">
              <Button component="span" variant="outlined" className={this.props.classes.button}>
                Neues Foto
              </Button>
            </label>
          </Toolbar>
        </AppBar>

        {
          this.state.photos ? <GridList cellHeight={160} className={this.props.classes.gridList} cols={3}>
            {this.state.photos.map(photo => (
              <GridListTile key={photo.id} cols={1}>
                <img src={photo.thumbnailLink}/>
              </GridListTile>
            ))}
          </GridList> : null
        }
      </div>
    );
  }

  componentDidMount() {
    loadGapi(photos => {
      this.setState({photos: photos});
      console.log('got fotos', photos);
      // fetchFoto(photos[0].id);
    });
  }

  fileUpload(evt) {
    console.log('got file to upload', evt.currentTarget.files[0]);
  }
}

export default withStyles(styles)(App);
