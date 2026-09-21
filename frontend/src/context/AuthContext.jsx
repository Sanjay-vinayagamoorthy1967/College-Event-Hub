import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: sessionStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  userType: sessionStorage.getItem('userType'), // 'student_internal', 'student_external', 'admin'
};

function authReducer(state, action) {
  switch (action.type) {
    case 'USER_LOADING':
      return { ...state, isLoading: true };
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        userType: action.payload.userType,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      sessionStorage.setItem('token', action.payload.token);
      sessionStorage.setItem('userType', action.payload.userType);
      return {
        ...state,
        token: action.payload.token,
        userType: action.payload.userType,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
      };
    case 'AUTH_ERROR':
    case 'LOGOUT':
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userType');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        userType: null,
      };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    const userType = sessionStorage.getItem('userType');

    if (!token) {
      dispatch({ type: 'AUTH_ERROR' });
      return;
    }

    dispatch({ type: 'USER_LOADING' });

    try {
      // Use authService.getMe()
      const data = await authService.getMe();
      dispatch({
        type: 'USER_LOADED',
        payload: { user: data.user, userType: data.user.role === 'admin' ? 'admin' : userType },
      });
    } catch (err) {
      console.error('Error loading user:', err);
      // Fallback for presentation: if backend fails or is not running, and we have a mock token, keep the mock user.
      if (token.startsWith('mock_')) {
        const mockEmail = token.replace('mock_', '');
        const mockUser = {
          id: 'mock_id',
          name: mockEmail.split('@')[0].toUpperCase(),
          email: mockEmail,
          role: userType === 'admin' ? 'admin' : 'student',
          department: 'CSE',
          year: '3',
          registerNumber: userType === 'student_internal' ? '111222333' : undefined,
          collegeName: userType === 'student_external' ? 'St. Joseph College' : undefined,
          phone: '9876543210',
          gender: 'Male',
        };
        dispatch({
          type: 'USER_LOADED',
          payload: { user: mockUser, userType },
        });
      } else {
        dispatch({ type: 'AUTH_ERROR' });
      }
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password, type) => {
    dispatch({ type: 'USER_LOADING' });
    try {
      let data;
      if (type === 'admin') {
        data = await authService.adminLogin(email, password);
      } else {
        data = await authService.login(email, password, type);
      }
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: data.token,
          userType: type,
          user: data.user,
        },
      });
      toast.success('Logged in successfully!');
      return true;
    } catch (err) {
      console.error('Backend login failed:', err.response?.data?.message || err.message);
      dispatch({ type: 'AUTH_ERROR' });
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
      return false;
    }
  };

  const register = async (formData, type) => {
    dispatch({ type: 'USER_LOADING' });
    try {
      const data = await authService.register(formData, type);
      // Do not dispatch REGISTER_SUCCESS yet, user needs to verify OTP
      toast.success('OTP sent to your email. Please verify.');
      return data; // Return the data (which includes the email) to the component
    } catch (err) {
      console.error('Backend registration failed:', err.response?.data?.message || err.message);
      dispatch({ type: 'AUTH_ERROR' });
      toast.error(err.response?.data?.message || 'Registration failed.');
      return false;
    }
  };

  const verifyOTP = async (email, otp, type) => {
    dispatch({ type: 'USER_LOADING' });
    try {
      const data = await authService.verifyOTP(email, otp, type);
      
      if (data.requiresApproval) {
        toast.success(data.message, { duration: 5000 });
        return { requiresApproval: true };
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: data.token,
          userType: type,
          user: data.user,
        },
      });
      toast.success('Email verified and logged in successfully!');
      return true;
    } catch (err) {
      console.error('Backend OTP verification failed:', err.response?.data?.message || err.message);
      dispatch({ type: 'AUTH_ERROR' });
      toast.error(err.response?.data?.message || 'Verification failed.');
      return false;
    }
  };

  const googleLogin = async (token) => {
    dispatch({ type: 'USER_LOADING' });
    try {
      const data = await authService.googleLogin(token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: data.token,
          userType: 'student_internal',
          user: data.user,
        },
      });
      toast.success('Logged in with Google successfully!');
      return true;
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR' });
      const errorMessage = err.response?.data?.message || 'Google Login failed.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const loginWithBarcodeOTP = useCallback((token, user) => {
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        token,
        userType: 'student_internal',
        user
      }
    });
    toast.success('Logged in successfully!');
  }, []);

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        googleLogin,
        register,
        verifyOTP,
        loginWithBarcodeOTP,
        logout,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
