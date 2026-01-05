import { Box, Text, Button, Heading } from 'grommet';
import { SchemaForm } from '@greenroom-robotics/alpha.schema-form';
import type { RJSFSchema } from '@greenroom-robotics/alpha.schema-form';
import chartImage from '../../public/chart.jpg';
import { useState } from 'react';
import { trpc } from '../trpc-react';
import { TexturedPanel } from '../components/TexturedPanel';

interface LoginPageProps {
  challengeId: string;
}

const loginSchema: RJSFSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      title: 'Username',
    },
    password: {
      type: 'string',
      title: 'Password',
    },
    remember: {
      type: 'boolean',
      title: 'Remember credentials',
    },
  },
  required: ['username', 'password'],
};

const uiSchema = {
  password: {
    'ui:widget': 'password',
  },
};

export const LoginPage: React.FC<LoginPageProps> = ({ challengeId }) => {
  const [error, setError] = useState<string>('');

  // Get challenge details
  const {
    data: challenge,
    isLoading,
    error: loadingError,
  } = trpc.app.getChallengeDetails.useQuery(challengeId);

  const submitCredentials = trpc.app.submitLoginCredentials.useMutation({
    onSuccess: () => {
      console.log('Credentials submitted successfully');
      // Close the login window on successful authentication
      window.close();
    },
    onError: (error: any) => {
      console.error('Error submitting credentials:', error);
      setError(error.message || 'Authentication failed');
    },
  });

  const cancelLogin = trpc.app.cancelLogin.useMutation({
    onSuccess: () => {
      console.log('Login cancelled');
      window.close();
    },
    onError: (error: any) => {
      console.error('Error cancelling login:', error);
      window.close();
    },
  });

  const handleSubmit = async (credentials: {
    username: string;
    password: string;
    remember: boolean;
  }) => {
    try {
      setError(''); // Clear any previous errors

      await submitCredentials.mutateAsync({
        challengeId,
        username: credentials.username,
        password: credentials.password,
        remember: credentials.remember,
      });
    } catch (error) {
      console.error('Error submitting login credentials:', error);
      // Error state is handled by the mutation onError
    }
  };

  const handleCancel = () => {
    cancelLogin.mutate({ challengeId });
  };

  if (isLoading) {
    return (
      <TexturedPanel fill>
        <Box align="center" justify="center" fill>
          <Text>Loading authentication details...</Text>
        </Box>
      </TexturedPanel>
    );
  }

  if (loadingError || !challenge) {
    return (
      <TexturedPanel fill>
        <Box align="center" justify="center" fill>
          <Text color="status-error">Error loading authentication challenge</Text>
          <Text size="small">{loadingError?.message || 'Challenge not found'}</Text>
        </Box>
      </TexturedPanel>
    );
  }

  return (
    <TexturedPanel fill direction="row">
      <Box
        flex
        style={{
          backgroundImage: `url(${chartImage})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right',
          backgroundColor: 'black',
        }}
        width="medium"
      />
      <Box flex pad="medium" overflow="auto" gap="small">
        <Box flex={false}>
          <Heading level={3} margin={{ top: 'none', bottom: 'small' }}>
            Login
          </Heading>
          <Text size="small">Host: {challenge.url}</Text>
        </Box>
        {error && (
          <Box flex={false} pad="small" background="status-error">
            <Text color="white" size="small">
              {error}
            </Text>
          </Box>
        )}
        <Box flex={false} margin={{ top: 'small' }} border pad="small">
          <SchemaForm
            schema={loginSchema}
            uiSchema={uiSchema}
            formData={{
              username: '',
              password: '',
              remember: false,
            }}
            onSubmit={(data) => handleSubmit(data!)}
            disabled={submitCredentials.isPending}
          >
            <Box direction="row" margin={{ top: 'medium' }}>
              <Button
                type="submit"
                label="Login"
                color="green"
                disabled={submitCredentials.isPending}
              />
              <Button type="button" color="white" label="Cancel" onClick={handleCancel} />
            </Box>
          </SchemaForm>
        </Box>
      </Box>
    </TexturedPanel>
  );
};
