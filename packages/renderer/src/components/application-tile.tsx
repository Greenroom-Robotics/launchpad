export interface IApplicationTileProps {
    title: string
    src: string
}
export const ApplicationTile = ({ title, src }: IApplicationTileProps) => {
  return (
    <div className="application-tile">
      <h2>{title}</h2>
      <img src={src} alt="Application Hero" />
    </div>
  );
}