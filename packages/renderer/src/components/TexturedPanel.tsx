import styled from 'styled-components';
import { Box } from 'grommet';

export const TexturedPanel = styled(Box)`
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.2) 1px,
    transparent 1px,
    transparent 6px
  );
  background-size: 4px 4px;
  background-color: #111;
`;
