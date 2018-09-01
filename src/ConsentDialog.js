import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';

export default class ConsentDialog extends React.Component {
  state = {
    name: '',
    error: false,
  };

  handleGo = () => {
    if (this.state.name.length < 3 || this.state.name.length > 15) {
      this.setState({error: true});
    } else {
      localStorage.setItem('name', this.state.name);
      this.props.onClose();
    }
  };

  handleChange = (e) => {
    this.setState({name: e.target.value});
  };

  render() {
    return (
      <Dialog
        open={this.props.open}
        onClose={this.handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Wie willst du erinnert werden?</DialogTitle>
        <DialogContent>
          <FormControl {...(this.state.error && {error: true})}>
            <InputLabel htmlFor="name">Name <span style={{color: 'red'}}>*</span></InputLabel>
            <Input
              autoFocus
              margin="dense"
              id="name"
              type="text"
              onChange={this.handleChange}
              fullWidth
            />
            {!this.state.error ?
              <FormHelperText>
                Dieser Name wird bei deinem Fotos angezeigt. Wähle weiße, du kannst es später nicht mehr ändern.
              </FormHelperText> :
              <FormHelperText>
                Der Name muss zwischen 3 und 15 Zeichen lang sein!
              </FormHelperText>
            }
          </FormControl>
          <p>
            Wir wollen deine hochgeladenen Fotos speichern und für unsere Zwecke eventuell weiter verwenden. Mit der
            Verwendung dieser App erlaubst du uns das.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleGo} color="primary">
            Los gehts!
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
