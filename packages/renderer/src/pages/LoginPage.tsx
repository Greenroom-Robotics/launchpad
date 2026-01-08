import { Box, Text, Button, Heading } from 'grommet';
import { SchemaForm } from '@greenroom-robotics/alpha.schema-form';
import type { RJSFSchema } from '@greenroom-robotics/alpha.schema-form';
import chartImage from '../assets/chart.jpg';
import { useState } from 'react';
import { trpc } from '../trpc-react';
import { TexturedPanel } from '../components/TexturedPanel';

interface LoginPageProps {
  url: string;
  realm?: string;
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

export const LoginPage: React.FC<LoginPageProps> = ({ url, realm }) => {
  const [error, setError] = useState<string>('');

  const submitCredentials = trpc.auth.submitLoginCredentials.useMutation({
    onSuccess: () => {
      console.log('Credentials submitted successfully');
      // Don't close window here - let the backend handle it via resolveLoginChallenge
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error('Error submitting credentials:', error);
      setError(error.message || 'Authentication failed');
    },
  });

  const cancelLogin = trpc.auth.cancelLogin.useMutation({
    onSuccess: () => {
      console.log('Login cancelled');
      window.close();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        url,
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
    cancelLogin.mutate({ url });
  };

  // No loading states needed - data comes from query parameters

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
          <Text size="small">Host: {url}</Text>
          {realm && <Text size="small">Realm: {realm}</Text>}
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
