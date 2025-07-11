import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 ">Create an account</h1>
          <p className="mt-2 text-slate-600">
            Join CreatorHub and start bringing your ideas to life
          </p>
        </div>
        
        <Card className="animate-scale-up">
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-error-50 dark:bg-error-900/20 text-error-800 dark:text-error-200 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <Input
                id="name"
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                leftIcon={<User size={16} />}
              />
              
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                leftIcon={<Mail size={16} />}
              />
              
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                leftIcon={<Lock size={16} />}
                helperText="Password must be at least 8 characters"
                minLength={8}
              />
              
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                leftIcon={<Lock size={16} />}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                Create account
              </Button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-(--primary-600) hover:text-(--primary-800)"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;