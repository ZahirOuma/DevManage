import React, { useState } from 'react';
import { AsyncStorage } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import memberService from '../services/memberService';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const member = await memberService.loginMember(email, password);
      if (member) {
        await AsyncStorage.setItem('user', JSON.stringify(member));
        navigation.replace('Main');
      }
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        setError('Invalid email or password');
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Rest of the component code
  );
};

export default LoginScreen; 