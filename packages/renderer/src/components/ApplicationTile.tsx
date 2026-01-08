import { Box, Heading, Text } from 'grommet';
import { useAsyncFn, useInterval, useEffectOnce } from 'react-use';
import { Loading } from './Loading';
import { useState } from 'react';
import gamaHeroImage from '/gama-hero-box.svg';
import lookoutHeroImage from '/lookout-hero-box.svg';
import maropsHeroImage from '/marops-hero-box.svg';
import missimHeroImage from '/missim-hero-box.svg';
import type { ApplicationInstance } from '@app/shared';

const applicationImages = {
  gama: gamaHeroImage,
  lookout: lookoutHeroImage,
  marops: maropsHeroImage,
  missim: missimHeroImage,
} as const;

export interface IApplicationTileProps {
  application: ApplicationInstance;
  onClick?: () => void | Promise<void>;
  checkConnectivity?: (url: string) => Promise<{ connected: boolean; error?: string }>;
}

export const ApplicationTile = ({
  application,
  onClick,
  checkConnectivity,
}: IApplicationTileProps) => {
  // State to track loading when clicking the application
  const [isClickLoading, setIsClickLoading] = useState(false);

  // Use useAsyncFn for connectivity checking with built-in loading/error states
  const [connectivityState, checkConnection] = useAsyncFn(async () => {
    if (!checkConnectivity) {
      return { connected: true };
    }

    const result = await checkConnectivity(application.url);
    return result;
  }, [application.url, checkConnectivity]);

  // Trigger initial check on mount
  useEffectOnce(() => {
    checkConnection();
  });

  // Use useInterval for periodic connectivity checks (every 30 seconds)
  useInterval(() => {
    checkConnection();
  }, 30 * 1000);

  const { loading, value } = connectivityState;
  const connected = value?.connected ?? false;

  const isClickable = connected && onClick;

  // Handle click with loading state
  const handleClick = async () => {
    if (!onClick || !connected) return;

    setIsClickLoading(true);
    try {
      const result = onClick();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error('Error during application click:', error);
    } finally {
      setIsClickLoading(false);
    }
  };
  const src = applicationImages[application.type];

  const getStatusColor = () => {
    if (loading) return 'status-unknown';
    return connected ? 'status-ok' : 'status-error';
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    return connected ? 'Connected' : 'Disconnected';
  };

  return (
    <Box
      onClick={isClickable ? handleClick : undefined}
      style={{
        cursor: isClickable && !isClickLoading ? 'pointer' : 'default',
        opacity: connected ? 1 : 0.8,
        position: 'relative',
      }}
      hoverIndicator={isClickable && !isClickLoading ? true : false}
      pad="small"
      border={{ color: getStatusColor(), size: 'xsmall' }}
      title={application.url}
    >
      <Box direction="row" justify="between" align="center" margin={{ bottom: 'xsmall' }}>
        <Heading level={4} margin="none">
          {application.name}
        </Heading>
        <Text size="xsmall" color={getStatusColor()} weight="bold">
          {getStatusText()}
        </Text>
      </Box>
      <img
        src={src}
        alt="Application Hero"
        style={{
          filter: connected ? 'none' : 'grayscale(100%)',
          transition: 'filter 0.3s ease',
        }}
      />
      <Loading overlay show={isClickLoading} background="rgba(0,0,0,0.5)" />
    </Box>
  );
};
