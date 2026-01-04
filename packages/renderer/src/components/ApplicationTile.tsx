import { Box, Heading } from "grommet";

export interface IApplicationTileProps {
    title: string
    src: string
}
export const ApplicationTile = ({ title, src }: IApplicationTileProps) => {
  return (
    <Box width="medium">
      <Heading level={3} margin={{ bottom: "small" }}>{title}</Heading>
      <img src={src} alt="Application Hero" />
    </Box>
  );
}