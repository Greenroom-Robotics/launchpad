import { Box, Text, Spinner } from 'grommet';
import type { BackgroundType, DirectionType } from 'grommet/utils';
import React from 'react';
import styled from 'styled-components';

const Outer = styled(Box)`
  &.overlay {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    position: absolute;
    z-index: 1000;
  }
`;

const CustomSpinner = styled(Spinner)`
  animation-duration: 1000ms;

`;

interface ILoadingProps {
  show?: boolean;
  overlay?: boolean;
  label?: string;
  background?: BackgroundType;
  style?: React.CSSProperties;
  direction?: DirectionType;
}

export const Loading = ({
  overlay,
  show = true,
  label,
  background,
  style,
  direction = 'column',
}: ILoadingProps) => {
  if (!show) {
    return null;
  }

  return (
    <Outer
      background={background}
      data-test={'loading-overlay'}
      style={style}
      align="center"
      justify="center"
      direction={direction}
      gap="medium"
      className={overlay ? 'overlay' : ''}
    >
      <Box>
        <CustomSpinner
          color="brand"
        />
      </Box>
      {label && <Text>{label}</Text>}
    </Outer>
  );
};