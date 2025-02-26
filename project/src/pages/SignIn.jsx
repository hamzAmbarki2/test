import { useState } from 'react';
import GitHubIcon from '@mui/icons-material/GitHub';
import { 
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  textTransform: 'none',
  fontSize: '1rem',
  '&.MuiButton-containedPrimary': {
    backgroundColor: '#dd2825',
    '&:hover': {
      backgroundColor: 'rgba(221, 40, 37, 0.7)',
    },
  },
}));

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [disabledTime, setDisabledTime] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [emailValid, setEmailValid] = useState(false); // Nouveau state pour gérer la validité de l'email

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));

    if (name === 'email') {
      validateEmail(value);
    }
  };

  const validateEmail = (email) => {
    // Expression régulière pour valider l'email
    const emailRegex = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?@(gmail|esprit|outlook)\.(tn|com)$/;
    if (!emailRegex.test(email)) {
      setEmailError('la forme de l\'adresse email est invalide.');
      setEmailValid(false);  // L'email n'est pas valide
    } else {
      setEmailError('');
      setEmailValid(true);  // L'email est valide
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
  
    // Vérification si l'email et le mot de passe sont vides
    if (!formData.email || !formData.password) {
      setError('Your fields are empty. Please enter your email and password.'); // Message d'erreur en anglais
      return;
    }
  
    // Vérification si l'email est valide avant la soumission
    if (emailError) {
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }
  
      // Sauvegarder le token
      localStorage.setItem('token', data.token);
  
      // Rediriger vers le tableau de bord admin
      navigate('/admin');
  
    } catch (err) {
      setError(err.message);
      setFailedAttempts(prev => prev + 1);  // Incrementer les tentatives échouées
  
      if (failedAttempts + 1 === 3) {
        setDisabledTime(5);
        const timeoutId = setTimeout(() => {
          setDisabledTime(0);
        }, 5000);
  
        return () => clearTimeout(timeoutId);
      }
  
      console.error('Login error:', err);
    }
  };
  
  

  return (
    <Container component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
        <Box
          component="div"
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <img 
            src="logo.png" 
            alt="" 
            style={{ height: '70px' }} 
          />
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }} noValidate>
        <TextField
  margin="normal"
  required
  fullWidth
  id="email"
  label="Email"
  name="email"
  autoComplete="email"
  autoFocus
  value={formData.email}
  onChange={handleChange}
  sx={{
    mb: 2,
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: emailValid ? '#3A9D23' : '',  // Bordure verte au survol si l'email est valide
      },
      '&.Mui-focused fieldset': {
        borderColor: emailValid ? '#3A9D23' : '',  // Bordure verte lors du focus si l'email est valide
      },
      '& fieldset': {
        borderColor: emailValid ? '#3A9D23' : '',  // Bordure verte si l'email est valide
      },
    },
  }}
  disabled={disabledTime > 0}
  error={!!emailError}  // Si il y a une erreur d'email, on met l'input en erreur
  helperText={emailError}  // Message d'erreur sous l'input
/>


          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
            disabled={disabledTime > 0}
          />
          <FormControlLabel
            control={
              <Checkbox
                value="remember"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                color="primary"
                disabled={disabledTime > 0}
              />
            }
            label="Remember Me"
          />
          <StyledButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={disabledTime > 0}
            sx={{
              //color: '#FFFFFF',  // This sets the text color to white
              // or
              color: 'white'     // This also works
            }}
          >
            Sign In
          </StyledButton>

          <Box sx={{ my: 2, textAlign: 'center' }}>
            <Divider sx={{ my: 2 }}>
              <Typography color="textSecondary">OR</Typography>
            </Divider>
          </Box>

          <StyledButton
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => console.log('Google sign in')}
            disabled={disabledTime > 0}
          >
            Sign in using Google
          </StyledButton>

          <StyledButton
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={() => console.log('GitHub sign in')}
            style={{ marginTop: '1px' }}
            disabled={disabledTime > 0}
          >
            Sign in using GitHub
          </StyledButton>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link
              href="#"
              variant="body2"
              onClick={() => navigate('/forgot-password')}
              sx={{ display: 'block', mb: 1 }}
            >
              I forgot my password
            </Link>
            <Link
              href="#"
              variant="body2"
              onClick={() => navigate('/signup')}
            >
              Register a new membership
            </Link>
          </Box>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default SignIn;
