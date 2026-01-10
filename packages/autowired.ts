export class Autowired {
  private constructor() {}

  private static readonly container: Record<string, unknown> = {};

  public static register(name: string, instance: unknown) {
    this.container[name] = instance;
  }

  public static get<T>(name: string): T {
    return this.container[name] as T;
  }
}
