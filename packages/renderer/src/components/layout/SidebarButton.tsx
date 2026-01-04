import { Button, Tip, Box, Text, type DropProps } from 'grommet';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

interface ISidebarButtonProps {
  to: string;
  icon: ReactElement;
  pathName: string;
  tip: string;
  exact?: boolean;
  active?: boolean;
  floatingTip?: boolean;
  disabled?: boolean;
}

const dropProps: DropProps = {
  align: { left: 'right' },
  plain: true,
  elevation: 'small',
};

export const SidebarButton = ({
  to,
  icon,
  pathName,
  active,
  tip,
  floatingTip = true,
  disabled,
}: ISidebarButtonProps) => {
  if (floatingTip)
    return (
      <Tip dropProps={dropProps} content={tip}>
        <Link to={to} style={{ textDecoration: 'white' }}>
          <Box direction="row" align="center" gap="small">
            <Button
              disabled={disabled}
              active={active || pathName === to}
              icon={icon}
              hoverIndicator
            />
          </Box>
        </Link>
      </Tip>
    );

  return (
    <Link to={to} style={{ textDecoration: 'white' }}>
      <Button hoverIndicator style={{ width: '100%', height: '50px' }}>
        <Box direction="row" gap="small" align="center" fill>
          <Button
            icon={icon}
            disabled={disabled}
            active={active || pathName === to}
          />
          <Text color="white" truncate style={{ width: 'auto' }}>
            {tip}
          </Text>
        </Box>
      </Button>
    </Link>
  );
};
