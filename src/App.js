import React, {Component} from 'react';
import './App.css';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {withStyles} from '@material-ui/core/styles';

const styles = theme => ({
  flex: {
    flexGrow: 1,
  },
  button: {
    margin: theme.spacing.unit,
  },
  hidden: {
    display: 'none',
  }
});


class App extends Component {
  render() {
    return (
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
    );
  }

  fileUpload(evt) {
    console.log('got file to upload', evt.currentTarget.files[0]);
  }
}

export default withStyles(styles)(App);
