import React, { useState } from "react";
import './App.css';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import axios from 'axios';
import { AppBar, Toolbar, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  const [value, setValue] = useState();
  const [results, setResults] = useState();

  const handleSubmit = () => {
    const api = 'http://localhost:5555'
    axios.post(`${api}/getResults`,
      {
        value: value
      }
    )
    .then(res => {
      if (res.status === 200) {
        setResults(res.data)
      }
    })
    .catch(err => {
      console.log(err.response);
    })
  }

  return (
    <>
      <CssBaseline />
      <Container maxWidth="xl" disableGutters>
        <AppBar
          position="sticky"
          variant="permanent"
          elevation={2}
        >
          <Toolbar>
            <Typography>Phase 4 Distributed Systems</Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md">
          <Box
            sx={{
              mt: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <TextField
              label="Enter data to be stored here"
              fullWidth
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button
              variant="contained"
              sx={{ mt: 1, mb: 3, width:'200px' }}
              type="submit"
              onClick={handleSubmit}
            >
              Store
            </Button>
            <Button
              variant="contained"
              sx={{ mt: 1, mb: 3, width:'200px' }}
              type="submit"
              onClick={handleSubmit}
            >
              Retrieve results
            </Button>
            {
              results
            }
          </Box>
        </Container>
      </Container>
    </>
  );
}

export default App;
