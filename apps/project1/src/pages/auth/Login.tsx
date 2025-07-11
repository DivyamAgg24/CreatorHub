import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
                    <p className="mt-2 text-slate-600">
                        Sign in to your account to continue
                    </p>
                </div>

                <Card className="animate-scale-up">
                    <CardHeader>
                        <CardTitle>Sign in</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your account
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
                            />

                            {/* <div className="text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-(--primary-600) hover:text-(--primary-700) dark:text-(--primary-400) dark:hover:text-(--primary-300)"
                                >
                                    Forgot password?
                                </Link>
                            </div> */}
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button
                                type="submit"
                                fullWidth
                                isLoading={isLoading}
                            >
                                Sign in
                            </Button>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="font-medium text-(--primary-600) hover:text-(--primary-700) dark:text-(--primary-400) dark:hover:text-(--primary-300)"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Login;