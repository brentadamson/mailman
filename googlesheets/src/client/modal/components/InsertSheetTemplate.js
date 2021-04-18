import { useState } from 'react';
import server from '../../utils/server';
const { serverFunctions } = server;
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import CreateIcon from '@material-ui/icons/Create';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import WarningIcon from '@material-ui/icons/Warning';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(0),
  },
  formControl: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  button: {
    marginRight: theme.spacing(1),
  },
  iconHelper: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  }
}));

export default function InsertSheetTemplate(props) {
  const classes = useStyles();
  const [disabled, setDisabled] = useState(false);
  
  const handleSubmit = (e) => {
    setDisabled(true);
    serverFunctions.insertNewSheetTemplate().then(function(data){
      serverFunctions.closeModal().then(function(data){
        setDisabled(false);
      }).catch(function(err){
        setDisabled(false);
      });
    }).catch(function(err){
      console.log(err);
      setDisabled(false);
    });
  }

  return (
    <>
      <Grid item xs={12}>
        <FormControl className={classes.formControl}>
          <Typography variant="h6" className={classes.iconHelper}><WarningIcon style={{color:'#ffcc00'}}/> There are no email recipients in your sheet</Typography>
          <FormHelperText>Email addresses should be in the <code>Email Address</code> column, starting on row 2.</FormHelperText>          
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" size="medium" color='primary' className={classes.button} startIcon={<CreateIcon />} fullWidth disabled={disabled} onClick={handleSubmit}>{disabled ? 'Creating Starter Sheet...' : 'Insert Starter Sheet'}</Button>
      </Grid>
    </>
  );
};
