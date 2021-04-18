import { useState } from 'react';
import server from '../../utils/server';
const { serverFunctions } = server;
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import DoneIcon from '@material-ui/icons/Done';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(0),
  },
}));

export default function Sent(props) {
  const classes = useStyles();
  const [disabled, setDisabled] = useState(false);
  
  const handleSubmit = (e) => {
    setDisabled(true);
    serverFunctions.closeModal().then(function(data){
      setDisabled(false);
    }).catch(function(err){
      setDisabled(false);
    });
  }

  return (
    <div className={classes.root}>
      <div style={{position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%, -50%)'}}>
      <Grid item xs={12}>
        <Grid item xs={12}>
          <DoneIcon  style={{position: 'absolute', left: '50%', top: '0%', transform: 'translate(-50%, -50%)', fontSize:24, color:'green'}} />
          <h1>{props.sentCount} emails sent</h1>
        </Grid>
        <Grid item xs={12}>
          <Button size="small" className={classes.button} fullWidth disabled={disabled} onClick={handleSubmit}>{disabled ? 'Closing...' : 'Close'}</Button>
        </Grid>
      </Grid>
      </div>
    </div>
  );
};
