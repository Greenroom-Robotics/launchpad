export interface IInitializable {
  initialize(): Promise<void> | void;
}
