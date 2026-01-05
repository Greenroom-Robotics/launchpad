import React from 'react';
import { Box, Text } from 'grommet';
import styled from 'styled-components';
import type { BorderType } from 'grommet/utils';

interface IHeaderProps {
  title: React.ReactNode;
  children?: React.ReactNode;
  border?: BorderType;
}

interface IDividerProps {
  color: string;
}

export const Divider = styled(Box)<IDividerProps>`
  border-right: 2px solid ${(props) => props.color};
  height: 30px;
  elevation: small;
`;

export const Header = React.forwardRef(({ title, children, border }: IHeaderProps) => {
  return (
    <Box
      pad="medium"
      direction="row"
      height="80px"
      justify="between"
      align="center"
      flex={false}
      border={border}
    >
      <Text weight="bold" color="white">
        {title}
      </Text>
      <Box flex />
      <Box direction="row" gap="small" align="center">
        {children}
      </Box>
    </Box>
  );
});

Header.displayName = 'Header';
