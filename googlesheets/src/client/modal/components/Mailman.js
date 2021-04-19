import { useState, useEffect } from 'react';
import server from '../../utils/server';
const { serverFunctions } = server;
import { formatMs, makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import DeleteIcon from '@material-ui/icons/Delete';
import GitHubIcon from '@material-ui/icons/GitHub';
import EditIcon from '@material-ui/icons/Edit';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import FormHelperText from '@material-ui/core/FormHelperText';
import Grid from '@material-ui/core/Grid';
import RefreshIcon from '@material-ui/icons/Refresh';
import draftToHtml from 'draftjs-to-html';
import { convertFromRaw, convertToRaw, EditorState } from "draft-js";

import DraftEditor from './DraftEditor';
import InsertSheetTemplate from './InsertSheetTemplate';
import Sent from './Sent'

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
  createTemplate: {
    color: theme.palette.primary.main,
  },
  selectedItem: {
    display: "flex",
  }
}));

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Mailman(props) {
  const classes = useStyles();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(false);
  const [selectedSenderIdx, setSelectedSenderIdx] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(-1);
  const [sentCount, setSentCount] = useState(0);
  // for the currently-selected template
  const [subject, setSubject] = useState('');
  const [contentState, setContentState] = useState(EditorState.createEmpty().getCurrentContent());
  const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState));

  // snackbar alert
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState(false);
  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
  };

  // get the user's templates
  useEffect(() => {
    setLoading(true);
    serverFunctions.getSheetData().then(function(data){
      setData(data);
      setSelectedSenderIdx(0);
    }).catch(function(err){
      setAlertMessage('Unable to get Sheet. Please try again.');
      setAlertOpen(true);
    }).then(serverFunctions.getTemplates().then(function(rsp){
      if(rsp.error){
        setAlertMessage(rsp.error);
        setAlertOpen(true);
      } else if (rsp.response && rsp.response.templates){
        setTemplates(rsp.response.templates);
      }
      setLoading(false);
    })).catch(function(err){
      setAlertMessage('Unable to get your saved templates. Please try again.');
      setAlertOpen(true);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if(selectedTemplate >= 0){
      setSubject(templates[selectedTemplate].subject);
      setContentState(convertFromRaw(templates[selectedTemplate].body));
      setEditorState(EditorState.createWithContent(convertFromRaw(templates[selectedTemplate].body)));
    } else {
      setSubject('');
      setContentState(EditorState.createEmpty().getCurrentContent());
      setEditorState(EditorState.createEmpty());
    }
  }, [selectedTemplate]);

  const handleTemplateChange = (e, idx) => {
    setSelectedTemplate(idx);
  }

  const handleEditTemplate = (e, idx) => {
    // have to set the index here, since they can click on "Edit" but not select it
    setSelectedTemplate(idx);
    setEditing(true);
  }

  const createNewTemplate = (e) => {
    setSubject('');
    setContentState(EditorState.createEmpty().getCurrentContent());  
    setSelectedTemplate(-1);
    setEditing(true);
  }

  const saveTemplate = (e) => {
    e.preventDefault();
    setLoading(true);
    var newTemplates = [...templates];
    var newTemplate = {'subject': subject, 'body': JSON.parse(JSON.stringify(convertToRaw(contentState)))} // this removes functions from contentState
    if (selectedTemplate >= 0){
      newTemplates[selectedTemplate] = newTemplate;
    } else {
      newTemplates.push(newTemplate);
    }
    saveTemplates(newTemplates);
  }

  const handleDeleteTemplate = (e, idx) => {
    setSelectedTemplate(-1);
    var d = [...templates];
    d.splice(idx, 1);
    saveTemplates(d);
  }

  const saveTemplates = (newTemplates) => {
    setLoading(true);
    serverFunctions.saveTemplates(newTemplates).then(function(rsp){
      if(rsp.error){
        setAlertMessage(rsp.error);
        setAlertOpen(true);
      } else if (rsp.response && rsp.response.templates){
        setTemplates(rsp.response.templates);        
      }
      setEditing(false);
      setLoading(false);
    }).catch(function(err){
      setAlertMessage('Unable to save your templates. Please try again.');
      setAlertOpen(true);
      setLoading(false);
    });
  }
  
  const handleSenderChange = (e, idx) => {
    setSelectedSenderIdx(idx);
  }

  const handleSend = (e, test) => {
    setLoading(true); // TODO: change it so the message is "Sending..."
    var currentTemplate = templates[selectedTemplate];
    currentTemplate.body = draftToHtml(currentTemplate.body);
    var d = {
      ...data,
      'sender': data.senders[selectedSenderIdx],
      'template': currentTemplate,
      'test': test,
    };

    serverFunctions.sendEmails(d).then(function(rsp){
      setSentCount(rsp);
      setLoading(false);
    }).catch(function(err){
      setAlertMessage('Unable to send emails. Please try again.');
      setAlertOpen(true);
      setSentCount(0);
      setLoading(false);
    });
  }

  return (
    <div className={classes.root}>
      <Grid container spacing={0}>
        { loading ? (
          <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
            <CircularProgress />
            <h5>loading...</h5>
          </div>
          ) : (
          editing ? <DraftEditor setEditing={setEditing} subject={subject} setSubject={setSubject} contentState={contentState} setContentState={setContentState} editorState={editorState} setEditorState={setEditorState} saveTemplate={saveTemplate} /> :
          sentCount > 0 ? <Sent sentCount={sentCount} /> :
          data.recipients === 0 ? <InsertSheetTemplate /> : (
            <div style={{marginTop:'50px', width:'100%'}}>
              <Grid item xs={12}>
                <FormControl className={classes.formControl}>
                  <InputLabel>Sender</InputLabel>
                  <Select
                    required
                    value={selectedSenderIdx >= 0 ? ((data.senders && data.senders.length > 0) ? data.senders[selectedSenderIdx] : '') : ''}
                    fullWidth
                  >
                    {data.senders && data.senders.map((sender, idx) => (
                      <MenuItem key={idx} value={sender} onClick={(e)=>handleSenderChange(e, idx)}>{sender}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl className={classes.formControl}>
                  <InputLabel>Please select an email template</InputLabel>
                  <Select
                    classes={{ select: classes.selectedItem }}
                    required
                    value={selectedTemplate >= 0 ? ((templates && templates.length > 0 && templates[selectedTemplate]) ? templates[selectedTemplate].subject : '') : ''}
                    fullWidth
                  >
                    {templates && templates.map((template, idx) => (
                      <MenuItem key={idx} value={template.subject} onClick={(e)=>handleTemplateChange(e, idx)}>
                        <ListItemText primary={template.subject} />
                        <ListItemIcon>
                          <EditIcon onClick={(e)=>handleEditTemplate(e, idx)} />
                        </ListItemIcon>
                        <ListItemIcon>
                          <DeleteIcon onClick={(e)=>handleDeleteTemplate(e, idx)} />
                        </ListItemIcon>
                      </MenuItem>
                    ))}
                    <MenuItem value="new_template" onClick={createNewTemplate}>
                      <ListItemIcon className={classes.createTemplate}>
                        <AddIcon className={classes.createTemplate} />
                      </ListItemIcon>
                      <ListItemText primary="Create new template" className={classes.createTemplate} />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" size="medium" color='secondary' className={classes.button} startIcon={<MailOutlineIcon />} onClick={(e)=>handleSend(e,true)} disabled={selectedSenderIdx < 0 || selectedTemplate < 0}>Send test email</Button>
                <Button variant="contained" size="medium" color='primary' className={classes.button} startIcon={<MailOutlineIcon />} onClick={(e)=>handleSend(e,false)} disabled={selectedSenderIdx < 0 || selectedTemplate < 0}>Send to {data.recipients} recipients</Button>
              </Grid>
              <Grid item xs={12} style={{marginTop:'25px'}}>
                <Grid item>
                  <Button size="small" className={classes.button} startIcon={<GitHubIcon />} href="https://github.com/brentadamson/mailman" target="_blank" fullWidth>Request a feature</Button>
                </Grid>
              </Grid>
              <Grid item xs={12} style={{marginTop:'25px'}}>
                <Grid item>
                  <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}>
                    <Alert onClose={handleAlertClose} severity="error">
                      {alertMessage}
                    </Alert>
                  </Snackbar>
                </Grid>
              </Grid>
            </div>
          )
        )}
      </Grid>
    </div>
  );
};
