import { makeStyles } from '@material-ui/core/styles';
import { Editor } from 'react-draft-wysiwyg';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import '../../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const useStyles = makeStyles((theme) => ({
  button: {
    marginRight: theme.spacing(1),
  }
}));

export default function DraftEditor(props) {
  const classes = useStyles();
  const cancel = (e, idx) => {
    props.setEditing(false);
  }
  
  const handleSubjectChange = (e) => {
    props.setSubject(e.target.value);
  }

  const onEditorStateChange = (es) => {
    props.setEditorState(es);
    props.setContentState(es.getCurrentContent());
  }

  return (
    <>
      <form noValidate autoComplete="off" onSubmit={(e)=>props.saveTemplate(e)}>
        <Typography variant="subtitle1" gutterBottom>
          Pro-tip: Use {'{{ placeholders }}'} in your subject and body to personalize the emails
        </Typography>
        <TextField label="Subject" variant="outlined" size="small" value={props.subject} onChange={handleSubjectChange} fullWidth />
        <Editor
          editorStyle={{'border':'1px solid #f1f1f1', 'height':'260px', 'paddingLeft':'5px'}}
          editorState={props.editorState}
          onEditorStateChange={onEditorStateChange}
          toolbar={{
            options: ['inline', 'image', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'history'],
          }}
        />
        <div style={{marginTop:'10px',float:'right'}}>
          <Button size="medium" color='secondary' className={classes.button} onClick={cancel}>Cancel</Button>
          <Button type="submit" size="medium" variant="contained" color='primary' className={classes.button} startIcon={<SaveIcon />} >Save</Button>
        </div>
      </form>
    </>
  );
}