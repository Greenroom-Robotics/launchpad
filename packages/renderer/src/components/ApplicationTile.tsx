import { Box, Heading } from "grommet";

export interface IApplicationTileProps {
    title: string
    src: string
    onClick?: () => void
}
export const ApplicationTile = ({ title, src, onClick }: IApplicationTileProps) => {
  return (
    <Box
      width="medium"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      hoverIndicator={onClick ? true : false}
      pad="small"
      round="small"
    >
      <Heading level={3} margin={{ bottom: "small" }}>{title}</Heading>
      <img src={src} alt="Application Hero" />
    </Box>
  );
}