import { Sidebar as GrommetSidebar, Box } from 'grommet';
import { Configure, AppsRounded } from 'grommet-icons';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router';
import { SidebarButton } from './SidebarButton';
import logoWhite from '/logo-white.svg';

const Logo = styled(Box)`
  img {
    filter: drop-shadow(0 2px 5px white);
    height: 50px;
  }
  margin-bottom: 15px;
`;

export const Sidebar = () => {
  const location = useLocation();
  const route = location.pathname;

  return (
    <GrommetSidebar
      background="dark-3"
      color="white"
      style={{ position: 'relative', width: '77px' }}
      flex={false}
    >
      <Link to="/" style={{ textDecoration: 'white' }}>
        <Logo background="black">
          <img src={logoWhite} />
        </Logo>
      </Link>
      <Box flex gap="xsmall">
        <SidebarButton
          tip="Launchpad"
          pathName={route}
          active={route === '/'}
          to={`/`}
          icon={<AppsRounded />}
        />
        {/* <SidebarButton
            tip="Install"
            pathName={route}
            active={route.startsWith('/installer')}
            to={`/installer`}
            icon={<Install />}
          /> */}
      </Box>
      <Box gap="xsmall" flex={false}>
        <SidebarButton
          tip="Settings"
          pathName={route}
          active={route.includes('/settings')}
          to={`/settings`}
          icon={<Configure />}
        />
      </Box>
    </GrommetSidebar>
  );
};
