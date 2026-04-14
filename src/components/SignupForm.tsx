import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import AgeVerification from './AgeVerification';
import { ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';
import { APP_NAME } from '../constants';

const SignupForm: React.FC = () => {
  const [step, setStep] = useState<'verify' | 'details'>('verify');
  const [isVerified, setIsVerified] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleVerified = (verifiedAge: number) => {
    setAge(verifiedAge);
    setIsVerified(true);
    setStep('details');
  };

  const handleRejected = (rejectedAge: number) => {
    setError(`Sorry, you must be 18 or older to join ${APP_NAME}. (Estimated age: ${rejectedAge})`);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isVerified || !age) {
      setError('Please complete age verification first.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.name,
      });

      // Store user metadata in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: formData.name,
        username: formData.username.toLowerCase(),
        age: age,
        isVerified: true,
        createdAt: Date.now(),
        bio: '',
        photoURL: user.photoURL || '',
      });

      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password signup is not enabled in Firebase Console. Please go to Authentication > Sign-in method and enable it.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-12 px-4">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-blue-600" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Join {APP_NAME}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Create an account to connect with others securely.
        </p>
      </div>

      {step === 'verify' ? (
        <AgeVerification onVerified={handleVerified} onRejected={handleRejected} />
      ) : (
        <Card className="p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <p>Age verified: {age}+ years. You're good to go!</p>
            </div>

            <Input
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Username"
              placeholder="johndoe"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </form>
        </Card>
      )}

      {error && step === 'verify' && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default SignupForm;
