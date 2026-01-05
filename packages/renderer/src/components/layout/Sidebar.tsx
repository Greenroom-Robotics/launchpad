import { Sidebar as GrommetSidebar, Box } from 'grommet';
import { Configure, AppsRounded } from 'grommet-icons';
import styled from 'styled-components';
import { Link, useMatch } from 'react-router';
import { SidebarButton } from './SidebarButton';

const Logo = styled(Box)`
  img {
    filter: drop-shadow(0 2px 5px white);
    height: 50px;
  }
  margin-bottom: 15px;
`;

export const Sidebar =() => {
    const match = useMatch(window.location.pathname);
    const route = match?.pathname || '/';

    return (
      <GrommetSidebar
        background="dark-3"
        color="white"
        style={{ position: 'relative', width: '77px' }}
        flex={false}
      >
        <Link to="/" style={{ textDecoration: 'white' }}>
          <Logo background="black">
            <img src="/logo-white.svg" />
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
  }
